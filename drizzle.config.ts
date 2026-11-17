import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.NUXT_DATABASE_URL || '.data/app.db'

export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: databaseUrl.startsWith('file:') || /^[a-z]+:\/\//.test(databaseUrl)
      ? databaseUrl
      : `file:${databaseUrl}`,
    authToken: process.env.NUXT_DATABASE_AUTH_TOKEN
  }
})
