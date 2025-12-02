import { defineEventHandler, readBody } from 'h3'
import { useDb } from '../utils/db'
import { events } from '../db/schema'
import { createSession } from '../utils/session'
import { eq, or } from 'drizzle-orm'


export default defineEventHandler(async (event) => {
  const body = await readBody<{ code: string }>(event)
  const code = body?.code?.trim()

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Code is required' })
  }

  const db = useDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const rows = await db
    .select()
    .from(events)
    .where(or(eq(events.hostCode, code), eq(events.guestCode, code)))
    .limit(1)

  const eventRow = rows[0]
  if (!eventRow) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid code' })
  }

  const role = code === eventRow.hostCode ? 'host' : 'guest'
  createSession(event, eventRow.id, role)

  return {
    redirect: role === 'host' ? `/host/${eventRow.id}` : `/guest/${eventRow.id}`,
    role,
    eventId: eventRow.id,
  }
})


