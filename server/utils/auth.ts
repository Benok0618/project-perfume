import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'

export async function requireUserId(event: H3Event) {
  const session = await requireUserSession(event)
  const id = Number(session.user.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return id
}

export async function requireAdminUserId(event: H3Event) {
  const session = await requireUserSession(event)
  const id = Number(session.user.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, id)).get()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (!user.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return id
}
