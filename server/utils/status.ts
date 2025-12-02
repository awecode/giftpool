import type { InferSelectModel } from 'drizzle-orm'
import { claims, items } from '../db/schema'

export type ItemRow = InferSelectModel<typeof items>
export type ClaimRow = InferSelectModel<typeof claims>

export type DerivedItemStatus = 'AVAILABLE' | 'PLANNED' | 'BOUGHT'

export interface ItemWithStatus extends ItemRow {
  status: DerivedItemStatus
  guestName: string | null
}

export function deriveItemStatus(item: ItemRow, itemClaims: ClaimRow[]): ItemWithStatus {
  if (!itemClaims.length) {
    return {
      ...item,
      status: 'AVAILABLE',
      guestName: null,
    }
  }

  // For MVP, take the most recent claim
  const latest = itemClaims.toSorted((a, b) => a.createdAt - b.createdAt)[itemClaims.length - 1]!

  const status: DerivedItemStatus = latest.status === 'BOUGHT' ? 'BOUGHT' : 'PLANNED'

  return {
    ...item,
    status,
    guestName: latest.guestName || 'Anonymous Guest',
  }
}


