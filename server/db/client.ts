import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const databaseUrl = process.env.NUXT_DATABASE_URL || '.data/app.db'
const filename = resolve(process.cwd(), databaseUrl)

mkdirSync(dirname(filename), { recursive: true })

const globalForDb = globalThis as typeof globalThis & {
  __perfumeSqlite?: Database.Database
}

const sqlite = globalForDb.__perfumeSqlite ?? new Database(filename)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

globalForDb.__perfumeSqlite = sqlite

export const db = drizzle(sqlite, { schema })
export { sqlite }
