import { orderIdSchema } from '../../../shared/schemas/order'
import { getUserOrder } from '../../utils/orders'
import { requireUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = orderIdSchema.safeParse(getRouterParam(event, 'id'))

  if (!id.success) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return getUserOrder(userId, id.data)
})
