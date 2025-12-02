import { defineEventHandler } from 'h3'
import { useDb } from '../../utils/db'
import { events, items, claims } from '../../db/schema'
import { requireSession } from '../../utils/session'
import { and, eq } from 'drizzle-orm'
import { deriveItemStatus } from '../../utils/status'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const eventId = Number(event.context.params?.eventId)

  if (!Number.isFinite(eventId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid event id' })
  }

  if (session.eventId !== eventId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const db = useDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const [eventRow] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const itemRows = await db.select().from(items).where(eq(items.eventId, eventId))
  const claimRows = await db.select().from(claims).where(
    and(
      claims.itemId.in(itemRows.map(i => i.id)),
    ),
  )

  const claimsByItem = new Map<number, typeof claimRows>()
  for (const c of claimRows) {
    const list = claimsByItem.get(c.itemId) ?? []
    list.push(c)
    claimsByItem.set(c.itemId, list)
  }

  const itemsWithStatus = itemRows.map((item) =>
    deriveItemStatus(item, claimsByItem.get(item.id) ?? []),
  )

  return {
    event: {
      ...eventRow,
      // Only host should see codes
      hostCode: session.role === 'host' ? eventRow.hostCode : undefined,
      guestCode: session.role === 'host' ? eventRow.guestCode : undefined,
    },
    items: itemsWithStatus,
    role: session.role,
  }
})


