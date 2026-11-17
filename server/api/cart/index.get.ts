import { getUserCartSummary } from '../../utils/cart'
import { requireUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return getUserCartSummary(userId)
})
