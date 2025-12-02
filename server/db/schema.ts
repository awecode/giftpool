import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const events = sqliteTable('events', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  date: text().notNull(),
  hostEmail: text().notNull(),
  hostCode: text().notNull().unique(),
  guestCode: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch()*1000)`),
})

export const items = sqliteTable('items', {
  id: integer().primaryKey({ autoIncrement: true }),
  eventId: integer().notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  link: text(),
  description: text(),
  quantity: integer(),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch()*1000)`),
})

export const claims = sqliteTable('claims', {
  id: integer().primaryKey({ autoIncrement: true }),
  itemId: integer().notNull().references(() => items.id, { onDelete: 'cascade' }),
  status: text({ enum: ['PLANNING', 'BOUGHT'] }).notNull(),
  guestName: text(),
  guestEmail: text(),
  isAnonymous: integer().notNull().default(0),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch()*1000)`),
})


