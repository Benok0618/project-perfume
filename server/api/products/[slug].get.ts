import { productSlugSchema } from '../../../shared/schemas/product'
import { findProduct } from '../../utils/products'

export default defineEventHandler((event) => {
  const parsed = productSlugSchema.safeParse(getRouterParam(event, 'slug'))

  if (!parsed.success) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const product = findProduct(parsed.data)

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return product
})
