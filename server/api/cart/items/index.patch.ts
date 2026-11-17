import { cartUpdateInputSchema } from '../../../../shared/schemas/cart'
import { updateUserCartItem } from '../../../utils/cart'
import { requireUserId } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, cartUpdateInputSchema.parse)
  return updateUserCartItem(userId, input)
})
