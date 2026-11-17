import { checkoutSchema } from '../../../shared/schemas/order'
import { createOrder } from '../../utils/orders'
import { requireUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, checkoutSchema.parse)
  return createOrder(userId, input)
})
