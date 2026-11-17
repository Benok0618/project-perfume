import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'
import { loginSchema } from '../../../shared/schemas/auth'
import { assertRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, loginSchema.parse)

  assertRateLimit(event, 'login', 10, 15 * 60 * 1000)

  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1)
  const valid = user ? await verifyPassword(user.passwordHash, input.password) : false

  if (!user || !valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in failed',
      message: 'Email or password is incorrect.'
    })
  }

  await setUserSession(event, { user: { id: user.id } })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    }
  }
})
