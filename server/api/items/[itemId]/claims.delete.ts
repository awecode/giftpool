import { defineEventHandler, readBody } from 'h3'
import { useDb } from '../../../utils/db'
import { items, events, claims } from '../../../db/schema'
import { requireSession } from '../../../utils/session'
import { and, desc, eq } from 'drizzle-orm'

interface UndoBody {
  name: string
}

export default defineEventHandler(async (event) => {
  const session = requireSession(event)

  const itemId = Number(event.context.params?.itemId)
  if (!Number.isFinite(itemId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id' })
  }

  const body = await readBody<UndoBody>(event)
  const rawName = body?.name?.trim()
  if (!rawName) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required to undo a claim' })
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

  const [latestClaim] = await db
    .select()
    .from(claims)
    .where(eq(claims.itemId, itemId))
    .orderBy(desc(claims.createdAt))
    .limit(1)

  if (!latestClaim) {
    throw createError({ statusCode: 404, statusMessage: 'No claim found for this item' })
  }

  const normalizedInput = rawName.toLowerCase()
  const normalizedStored = (latestClaim.guestName ?? '').trim().toLowerCase()

  if (!normalizedStored || normalizedStored !== normalizedInput) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Name does not match the person who claimed this item',
    })
  }

  await db.delete(claims).where(eq(claims.id, latestClaim.id))

  return { success: true }
})


