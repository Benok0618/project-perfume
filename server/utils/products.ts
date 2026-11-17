import { db } from '../db/client'
import { productSizes, products } from '../db/schema'
import type { Product, ProductSize } from '../../shared/types'

type ProductRow = typeof products.$inferSelect

function toProduct(row: ProductRow, sizes: ProductSize[]): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    audience: row.audience,
    scentFamily: row.scentFamily,
    topNotes: row.topNotes,
    heartNotes: row.heartNotes,
    baseNotes: row.baseNotes,
    intensity: row.intensity,
    occasions: row.occasions,
    seasons: row.seasons,
    images: row.images,
    isFeatured: row.isFeatured,
    sizes
  }
}

export async function listProducts(): Promise<Product[]> {
  const [rows, sizeRows] = await Promise.all([
    db.select().from(products),
    db.select().from(productSizes)
  ])

  const grouped = new Map<number, ProductSize[]>()

  for (const size of sizeRows) {
    const sizes = grouped.get(size.productId) ?? []
    sizes.push({ sizeMl: size.sizeMl, priceCents: size.priceCents, stock: size.stock })
    grouped.set(size.productId, sizes)
  }

  return rows.map(row => toProduct(row, (grouped.get(row.id) ?? []).sort((a, b) => a.sizeMl - b.sizeMl)))
}

export async function findProduct(slug: string): Promise<Product | null> {
  const all = await listProducts()
  return all.find(product => product.slug === slug) ?? null
}
