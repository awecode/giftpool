import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

let _db: DrizzleD1Database | LibSQLDatabase<typeof schema>

export function useDb() {
  if (!_db) {
    // const dbBinding = useEvent().context.cloudflare?.env?.DB
    // @ts-expect-error globalThis.__env__ is not defined
    const dbBinding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (dbBinding) {
      _db = drizzleD1(dbBinding, {
        casing: 'snake_case',
        schema,
        // logger: true,
      })
    }
    else {
      //   const { databaseUrl } = useRuntimeConfig()
      const databaseUrl = process.env.NUXT_DATABASE_URL
      if (databaseUrl) {
        _db = drizzle(databaseUrl as string, {
          casing: 'snake_case',
          schema,
          // logger: true,
        })
      }
      else {
        // throw new Error('No db binding or configuration found.')
        console.error('No db binding or configuration found.')
      }
    }
  }
  return _db
}

export type DbType = ReturnType<typeof useDb>
