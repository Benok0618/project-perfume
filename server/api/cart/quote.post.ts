import { cartItemsInputSchema } from '../../../shared/schemas/cart'
import { buildCartSummary } from '../../utils/cart'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, cartItemsInputSchema.parse)
  return buildCartSummary(input.items)
})
