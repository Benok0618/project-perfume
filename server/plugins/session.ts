import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'

export default () => {
  sessionHooks.hook('fetch', async (session) => {
    const id = Number(session.user?.id)

    if (!Number.isInteger(id) || id <= 0) return

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin
    }).from(users).where(eq(users.id, id)).limit(1)

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Session expired' })
    }

    session.user = user
  })
}
