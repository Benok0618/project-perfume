import { listUserOrders } from '../../utils/orders'
import { requireUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return listUserOrders(userId)
})
