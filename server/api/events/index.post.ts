import { defineEventHandler, readBody } from 'h3'
import { useDb } from '../../utils/db'
import { events } from '../../db/schema'
import { generateHostCode, generateGuestCode, createSession } from '../../utils/session'
import { sendSesEmail } from '../../utils/ses'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string, date: string, hostEmail: string }>(event)

  if (!body?.name || !body?.date || !body?.hostEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const db = useDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const hostCode = generateHostCode()
  const guestCode = generateGuestCode()

  const [inserted] = await db.insert(events).values({
    name: body.name,
    date: body.date,
    hostEmail: body.hostEmail,
    hostCode,
    guestCode,
  }).returning()

  const session = createSession(event, inserted.id, 'host')

  const baseUrl = `${event.node.req.headers['x-forwarded-proto'] ?? 'https'}://${event.node.req.headers.host}`
  const hostUrl = `${baseUrl}/host/${inserted.id}`
  const guestUrl = `${baseUrl}/guest/${inserted.id}`

  const subject = `Your event "${inserted.name}" has been created`
  const message = [
    `Event: ${inserted.name}`,
    `Date: ${inserted.date}`,
    '',
    `Host code: ${hostCode}`,
    `Guest code: ${guestCode}`,
    '',
    `Host dashboard: ${hostUrl}`,
    `Guest link (share with invitees): ${guestUrl}`,
  ].join('\n')

  await sendSesEmail({
    toEmails: [inserted.hostEmail],
    subject,
    message,
  })

  return {
    event: inserted,
    session,
    redirect: `/host/${inserted.id}`,
  }
})


