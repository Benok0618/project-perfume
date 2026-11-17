import { z } from 'zod'
import type { Product } from '../types'
import { AUDIENCES, OCCASIONS, SCENT_FAMILIES } from '../types'

export const PRODUCT_SORTS = ['featured', 'price-asc', 'price-desc', 'newest'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

export const PRODUCT_SIZES = [30, 50, 100] as const

function splitList(value: unknown) {
  if (typeof value === 'string') {
    return value.split(',').map(part => part.trim()).filter(Boolean)
  }
  return value
}

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  audience: z.enum(AUDIENCES).optional(),
  family: z.preprocess(splitList, z.array(z.enum(SCENT_FAMILIES)).optional()),
  occasion: z.preprocess(splitList, z.array(z.enum(OCCASIONS)).optional()),
  size: z.coerce.number().int().refine(value => (PRODUCT_SIZES as readonly number[]).includes(value)).optional(),
  intensity: z.coerce.number().int().min(1).max(5).optional(),
  minPrice: z.coerce.number().int().min(0).max(100000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(100000).optional(),
  sort: z.enum(PRODUCT_SORTS).default('featured')
})
  .strict()
  .refine(data => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice, {
    message: 'minPrice must not exceed maxPrice',
    path: ['minPrice']
  })

export type ProductQuery = z.infer<typeof productQuerySchema>

export const productSlugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/)

export interface ProductListResponse {
  products: Product[]
  total: number
  priceRange: {
    min: number
    max: number
  }
}
