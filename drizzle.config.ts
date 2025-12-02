import process from 'node:process'
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL!,
  },
})