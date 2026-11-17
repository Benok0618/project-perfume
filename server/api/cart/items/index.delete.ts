import { cartRemoveInputSchema } from '../../../../shared/schemas/cart'
import { removeUserCartItem } from '../../../utils/cart'
import { requireUserId } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, cartRemoveInputSchema.parse)
  return removeUserCartItem(userId, input.productId, input.sizeMl)
})
