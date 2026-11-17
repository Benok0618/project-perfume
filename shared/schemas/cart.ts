import { z } from 'zod'

export const MAX_CART_QUANTITY = 99

export const cartLineInputSchema = z.object({
  productId: z.number().int().positive(),
  sizeMl: z.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY)
}).strict()

export const cartUpdateInputSchema = z.object({
  productId: z.number().int().positive(),
  sizeMl: z.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY).optional(),
  newSizeMl: z.number().int().positive().optional()
}).strict().refine(input => input.quantity !== undefined || input.newSizeMl !== undefined, {
  message: 'Nothing to update'
})

export const cartRemoveInputSchema = z.object({
  productId: z.number().int().positive(),
  sizeMl: z.number().int().positive()
}).strict()

export const cartItemsInputSchema = z.object({
  items: z.array(cartLineInputSchema).max(50)
}).strict()

export type CartLineInput = z.infer<typeof cartLineInputSchema>
export type CartUpdateInput = z.infer<typeof cartUpdateInputSchema>
export type CartRemoveInput = z.infer<typeof cartRemoveInputSchema>
export type CartItemsInput = z.infer<typeof cartItemsInputSchema>
