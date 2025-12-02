import { defineEventHandler } from 'h3'
import { useDb } from '../../../utils/db'
import { items, events, claims } from '../../../db/schema'
import { requireSession } from '../../../utils/session'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)

  const itemId = Number(event.context.params?.itemId)
  if (!Number.isFinite(itemId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id' })
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

  await db.delete(claims).where(eq(claims.itemId, itemId))

  return { success: true }
})


