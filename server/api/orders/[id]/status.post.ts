import { orderIdSchema, orderStatusUpdateSchema } from '../../../../shared/schemas/order'
import { advanceOrderStatus } from '../../../utils/orders'
import { requireAdminUserId } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUserId(event)

  const id = orderIdSchema.safeParse(getRouterParam(event, 'id'))

  if (!id.success) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const input = await readValidatedBody(event, orderStatusUpdateSchema.parse)
  return advanceOrderStatus(id.data, input.status, input.trackingNumber)
})
