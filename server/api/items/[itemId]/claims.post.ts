import { defineEventHandler, readBody } from 'h3'
import { useDb } from '../../../utils/db'
import { items, events, claims } from '../../../db/schema'
import { requireSession } from '../../../utils/session'
import { and, eq } from 'drizzle-orm'
import { sendSesEmail } from '../../../utils/ses'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)

  const itemId = Number(event.context.params?.itemId)
  if (!Number.isFinite(itemId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id' })
  }

  const body = await readBody<{ status: 'PLANNING' | 'BOUGHT', name?: string, email?: string }>(event)
  if (!body?.status || !['PLANNING', 'BOUGHT'].includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  const db = useDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const [itemRow] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1)

  if (!itemRow) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const [eventRow] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, itemRow.eventId)))
    .limit(1)

  if (!eventRow || eventRow.id !== session.eventId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const [inserted] = await db.insert(claims).values({
    itemId,
    status: body.status,
    guestName: body.name,
    guestEmail: body.email,
  }).returning()

  if (body.status === 'BOUGHT') {
    const displayName = body.name || 'Anonymous Guest'
    const subject = `An item was bought for "${eventRow.name}"`
    const message = `${displayName} marked "${itemRow.name}" as bought.`
    await sendSesEmail({
      toEmails: [eventRow.hostEmail],
      subject,
      message,
    })
  }

  return inserted
})


