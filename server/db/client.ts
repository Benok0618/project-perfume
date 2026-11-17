import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import type { Client } from '@libsql/client'
import { createClient as createRemoteClient } from '@libsql/client/http'
import { drizzle } from 'drizzle-orm/libsql/http'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

const DEFAULT_DATABASE_URL = 'file:.data/app.db'

interface DatabaseConfig {
  url: string
  authToken?: string
}

function runtimeConfigValues(): { url?: string, authToken?: string } {
  try {
    const runtimeConfig = useRuntimeConfig()
    return { url: runtimeConfig.databaseUrl, authToken: runtimeConfig.databaseAuthToken }
  } catch {
    // Seed and migration scripts run outside Nitro, where runtime config is unavailable.
    return {}
  }
}

function resolveDatabaseConfig(): DatabaseConfig {
  const config = runtimeConfigValues()

  return {
    url: process.env.NUXT_DATABASE_URL || config.url || DEFAULT_DATABASE_URL,
    authToken: process.env.NUXT_DATABASE_AUTH_TOKEN || config.authToken || undefined
  }
}

function prepareLocalDirectory(url: string) {
  if (!url.startsWith('file:')) return

  const path = url.slice('file:'.length)
  mkdirSync(dirname(resolve(process.cwd(), path)), { recursive: true })
}

function connect(config: DatabaseConfig): Client {
  if (!config.url.startsWith('file:')) return createRemoteClient(config)

  // Loading the sqlite3 client eagerly would tie serverless functions to a native binary they never use.
  const requireModule = createRequire(resolve(process.cwd(), 'package.json'))
  const { createClient } = requireModule('@libsql/client/sqlite3') as typeof import('@libsql/client/sqlite3')
  return createClient(config)
}

const config = resolveDatabaseConfig()
prepareLocalDirectory(config.url)

const globalForDb = globalThis as typeof globalThis & {
  __perfumeDb?: LibSQLDatabase<typeof schema>
}

export const db = globalForDb.__perfumeDb ?? drizzle(connect(config), { schema })

globalForDb.__perfumeDb = db
