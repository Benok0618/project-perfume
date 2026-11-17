import { cartLineInputSchema } from '../../../../shared/schemas/cart'
import { addUserCartItem } from '../../../utils/cart'
import { requireUserId } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await readValidatedBody(event, cartLineInputSchema.parse)
  return addUserCartItem(userId, input)
})
