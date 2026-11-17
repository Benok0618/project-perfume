import type { Product } from '../../../shared/types'
import { productQuerySchema } from '../../../shared/schemas/product'
import type { ProductListResponse } from '../../../shared/schemas/product'
import { listProducts } from '../../utils/products'

function minPrice(product: Product) {
  return Math.min(...product.sizes.map(size => size.priceCents))
}

function matchesTerm(product: Product, term: string) {
  const haystack = [
    product.name,
    product.tagline,
    product.description,
    product.scentFamily,
    ...product.topNotes,
    ...product.heartNotes,
    ...product.baseNotes
  ].join(' ').toLowerCase()

  return haystack.includes(term)
}

function matchesAudience(product: Product, audience: Product['audience']) {
  return audience === 'unisex' ? product.audience === 'unisex' : product.audience === audience || product.audience === 'unisex'
}

export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const query = await getValidatedQuery(event, input => productQuerySchema.parse(input))
  const all = await listProducts()
  const prices = all.flatMap(product => product.sizes.map(size => size.priceCents))
  const priceRange = prices.length
    ? { min: Math.floor(Math.min(...prices) / 100), max: Math.ceil(Math.max(...prices) / 100) }
    : { min: 0, max: 0 }

  const term = query.q?.toLowerCase()
  const minCents = query.minPrice === undefined ? null : query.minPrice * 100
  const maxCents = query.maxPrice === undefined ? null : query.maxPrice * 100

  const filtered = all.filter((product) => {
    if (query.audience && !matchesAudience(product, query.audience)) return false
    if (query.family?.length && !query.family.includes(product.scentFamily)) return false
    if (query.occasion?.length && !query.occasion.some(occasion => product.occasions.includes(occasion))) return false
    if (query.intensity && product.intensity !== query.intensity) return false
    if (query.size && !product.sizes.some(size => size.sizeMl === query.size && size.stock > 0)) return false

    if (minCents !== null || maxCents !== null) {
      const inRange = product.sizes.some(size =>
        (minCents === null || size.priceCents >= minCents)
        && (maxCents === null || size.priceCents <= maxCents))

      if (!inRange) return false
    }

    if (term && !matchesTerm(product, term)) return false

    return true
  })

  const sorted = [...filtered]

  switch (query.sort) {
    case 'price-asc':
      sorted.sort((a, b) => minPrice(a) - minPrice(b))
      break
    case 'price-desc':
      sorted.sort((a, b) => minPrice(b) - minPrice(a))
      break
    case 'newest':
      sorted.sort((a, b) => b.id - a.id)
      break
    default:
      sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.id - b.id)
  }

  return {
    products: sorted,
    total: sorted.length,
    priceRange
  }
})
