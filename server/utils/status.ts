import type { InferSelectModel } from 'drizzle-orm'
import { claims, items } from '../db/schema'

export type ItemRow = InferSelectModel<typeof items>
export type ClaimRow = InferSelectModel<typeof claims>

export type DerivedItemStatus = 'AVAILABLE' | 'PLANNED' | 'BOUGHT'

export interface ItemWithStatus extends ItemRow {
  status: DerivedItemStatus
  hostDisplayName: string | null
  guestDisplayName: string | null
}

export function deriveItemStatus(item: ItemRow, itemClaims: ClaimRow[]): ItemWithStatus {
  if (!itemClaims.length) {
    return {
      ...item,
      status: 'AVAILABLE',
      hostDisplayName: null,
      guestDisplayName: null,
    }
  }

  // For MVP, take the most recent claim
  const latest = itemClaims.toSorted((a, b) => a.createdAt - b.createdAt)[itemClaims.length - 1]!

  const status: DerivedItemStatus = latest.status === 'BOUGHT' ? 'BOUGHT' : 'PLANNED'

  const hasName = !!latest.guestName && latest.guestName.trim().length > 0
  const baseName = hasName ? latest.guestName!.trim() : 'Anonymous Guest'

  const hostDisplayName = latest.isAnonymous ? 'Anonymous Guest' : baseName
  const guestDisplayName = status === 'AVAILABLE' ? null : 'Anonymous Guest'

  return {
    ...item,
    status,
    hostDisplayName,
    guestDisplayName,
  }
}


