import { defineEventHandler, readBody } from 'h3'
import { useDb } from '../../../utils/db'
import { events, items } from '../../../db/schema'
import { requireSession } from '../../../utils/session'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const eventId = Number(event.context.params?.eventId)

  if (session.role !== 'host') {
    throw createError({ statusCode: 403, statusMessage: 'Host access required' })
  }
  if (!Number.isFinite(eventId) || session.eventId !== eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid event id' })
  }

  const body = await readBody<{ name: string, link?: string, description?: string, quantity?: number }>(event)
  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Item name is required' })
  }

  const db = useDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const [eventRow] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const [inserted] = await db.insert(items).values({
    eventId,
    name: body.name,
    link: body.link,
    description: body.description,
    quantity: body.quantity,
  }).returning()

  return inserted
})


