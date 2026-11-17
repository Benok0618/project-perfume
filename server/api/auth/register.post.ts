import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'
import { registerSchema } from '../../../shared/schemas/auth'
import { assertRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, registerSchema.parse)

  assertRateLimit(event, 'register', 10, 60 * 60 * 1000)

  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).get()

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Registration failed',
      message: 'An account could not be created with those details.'
    })
  }

  const passwordHash = await hashPassword(input.password)

  const created = db.insert(users).values({
    email: input.email,
    name: input.name,
    passwordHash
  }).returning({
    id: users.id,
    email: users.email,
    name: users.name,
    isAdmin: users.isAdmin
  }).get()

  if (!created) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed',
      message: 'An account could not be created. Please try again.'
    })
  }

  await setUserSession(event, { user: { id: created.id } })

  return { user: created }
})
