import { cartItemsInputSchema } from '../../../shared/schemas/cart'
import { mergeUserCart } from '../../utils/cart'
import { requireUserId } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, cartItemsInputSchema.parse)
  return mergeUserCart(userId, input.items)
})
