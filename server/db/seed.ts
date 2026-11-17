import { existsSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import type { Audience, Occasion, ScentFamily, Season } from '../../shared/types'

if (existsSync('.env')) process.loadEnvFile('.env')

const { db, sqlite } = await import('./client')
const { products: productsTable, productSizes, users } = await import('./schema')

interface SeedProduct {
  slug: string
  name: string
  tagline: string
  description: string
  audience: Audience
  scentFamily: ScentFamily
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  intensity: number
  occasions: Occasion[]
  seasons: Season[]
  images: string[]
  isFeatured: boolean
  sizes: { sizeMl: number, priceCents: number, stock: number }[]
}

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.'

function sizes(prices: [number, number, number], stock: [number, number, number]): SeedProduct['sizes'] {
  return [
    { sizeMl: 30, priceCents: prices[0], stock: stock[0] },
    { sizeMl: 50, priceCents: prices[1], stock: stock[1] },
    { sizeMl: 100, priceCents: prices[2], stock: stock[2] }
  ]
}

const catalog: SeedProduct[] = [
  {
    slug: 'lorem-ipsum-no-1',
    name: 'Lorem Ipsum No. 1',
    tagline: 'Lorem ipsum dolor sit amet',
    description: lorem,
    audience: 'men',
    scentFamily: 'woody',
    topNotes: ['Bergamot', 'Black Pepper'],
    heartNotes: ['Cedar', 'Vetiver'],
    baseNotes: ['Leather', 'Amberwood'],
    intensity: 4,
    occasions: ['night', 'formal'],
    seasons: ['autumn', 'winter'],
    images: ['/media/products/lorem-01.svg', '/media/products/lorem-01-detail.svg', '/media/products/lorem-01-mood.svg'],
    isFeatured: true,
    sizes: sizes([7200, 10400, 15600], [18, 24, 12])
  },
  {
    slug: 'lorem-ipsum-no-2',
    name: 'Lorem Ipsum No. 2',
    tagline: 'Consectetur adipiscing elit',
    description: lorem,
    audience: 'men',
    scentFamily: 'aromatic',
    topNotes: ['Lavender', 'Mint'],
    heartNotes: ['Sage', 'Geranium'],
    baseNotes: ['Tonka Bean', 'Oakmoss'],
    intensity: 3,
    occasions: ['day', 'office'],
    seasons: ['spring', 'summer'],
    images: ['/media/products/lorem-02.svg', '/media/products/lorem-02-detail.svg', '/media/products/lorem-02-mood.svg'],
    isFeatured: false,
    sizes: sizes([6800, 9600, 14200], [30, 26, 16])
  },
  {
    slug: 'lorem-ipsum-no-3',
    name: 'Lorem Ipsum No. 3',
    tagline: 'Integer posuere erat a ante',
    description: lorem,
    audience: 'men',
    scentFamily: 'amber',
    topNotes: ['Cardamom', 'Saffron'],
    heartNotes: ['Incense', 'Patchouli'],
    baseNotes: ['Benzoin', 'Oud'],
    intensity: 5,
    occasions: ['night', 'date'],
    seasons: ['autumn', 'winter'],
    images: ['/media/products/lorem-03.svg', '/media/products/lorem-03-detail.svg', '/media/products/lorem-03-mood.svg'],
    isFeatured: true,
    sizes: sizes([8400, 12200, 18400], [14, 20, 9])
  },
  {
    slug: 'lorem-ipsum-no-4',
    name: 'Lorem Ipsum No. 4',
    tagline: 'Nulla vitae elit libero',
    description: lorem,
    audience: 'men',
    scentFamily: 'fresh',
    topNotes: ['Grapefruit', 'Juniper'],
    heartNotes: ['Neroli', 'Ginger'],
    baseNotes: ['Cedar', 'White Musk'],
    intensity: 2,
    occasions: ['day', 'office'],
    seasons: ['spring', 'summer'],
    images: ['/media/products/lorem-04.svg', '/media/products/lorem-04-detail.svg', '/media/products/lorem-04-mood.svg'],
    isFeatured: false,
    sizes: sizes([6400, 9000, 13400], [34, 30, 22])
  },
  {
    slug: 'lorem-ipsum-no-5',
    name: 'Lorem Ipsum No. 5',
    tagline: 'A pharetra augue mollis',
    description: lorem,
    audience: 'women',
    scentFamily: 'floral',
    topNotes: ['Pear', 'Pink Pepper'],
    heartNotes: ['Rose', 'Jasmine'],
    baseNotes: ['White Musk', 'Cedar'],
    intensity: 3,
    occasions: ['day', 'date'],
    seasons: ['spring'],
    images: ['/media/products/lorem-05.svg', '/media/products/lorem-05-detail.svg', '/media/products/lorem-05-mood.svg'],
    isFeatured: true,
    sizes: sizes([7400, 10800, 16200], [22, 28, 15])
  },
  {
    slug: 'lorem-ipsum-no-6',
    name: 'Lorem Ipsum No. 6',
    tagline: 'Donec ullamcorper nulla non',
    description: lorem,
    audience: 'women',
    scentFamily: 'gourmand',
    topNotes: ['Bergamot', 'Almond'],
    heartNotes: ['Vanilla', 'Tonka Bean'],
    baseNotes: ['Praline', 'Sandalwood'],
    intensity: 4,
    occasions: ['date', 'night'],
    seasons: ['autumn', 'winter'],
    images: ['/media/products/lorem-06.svg', '/media/products/lorem-06-detail.svg', '/media/products/lorem-06-mood.svg'],
    isFeatured: false,
    sizes: sizes([7800, 11400, 17000], [20, 24, 11])
  },
  {
    slug: 'lorem-ipsum-no-7',
    name: 'Lorem Ipsum No. 7',
    tagline: 'Cras mattis consectetur purus',
    description: lorem,
    audience: 'women',
    scentFamily: 'floral',
    topNotes: ['Mandarin', 'Peony'],
    heartNotes: ['Freesia', 'Lily'],
    baseNotes: ['Amber', 'Musk'],
    intensity: 2,
    occasions: ['day', 'office'],
    seasons: ['spring', 'summer'],
    images: ['/media/products/lorem-07.svg', '/media/products/lorem-07-detail.svg', '/media/products/lorem-07-mood.svg'],
    isFeatured: false,
    sizes: sizes([6600, 9400, 14000], [32, 27, 19])
  },
  {
    slug: 'lorem-ipsum-no-8',
    name: 'Lorem Ipsum No. 8',
    tagline: 'Vestibulum id ligula porta',
    description: lorem,
    audience: 'women',
    scentFamily: 'amber',
    topNotes: ['Plum', 'Saffron'],
    heartNotes: ['Rose', 'Oud'],
    baseNotes: ['Vanilla', 'Labdanum'],
    intensity: 5,
    occasions: ['night', 'formal'],
    seasons: ['autumn', 'winter'],
    images: ['/media/products/lorem-08.svg', '/media/products/lorem-08-detail.svg', '/media/products/lorem-08-mood.svg'],
    isFeatured: true,
    sizes: sizes([8600, 12600, 18800], [16, 18, 8])
  },
  {
    slug: 'lorem-ipsum-no-9',
    name: 'Lorem Ipsum No. 9',
    tagline: 'Fusce dapibus tellus ac',
    description: lorem,
    audience: 'unisex',
    scentFamily: 'woody',
    topNotes: ['Bergamot', 'Violet Leaf'],
    heartNotes: ['Iris', 'Cedar'],
    baseNotes: ['Sandalwood', 'Musk'],
    intensity: 3,
    occasions: ['day', 'office'],
    seasons: ['spring', 'autumn', 'winter'],
    images: ['/media/products/lorem-09.svg', '/media/products/lorem-09-detail.svg', '/media/products/lorem-09-mood.svg'],
    isFeatured: true,
    sizes: sizes([7600, 11000, 16400], [26, 31, 17])
  },
  {
    slug: 'lorem-ipsum-no-10',
    name: 'Lorem Ipsum No. 10',
    tagline: 'Maecenas sed diam eget risus',
    description: lorem,
    audience: 'unisex',
    scentFamily: 'fresh',
    topNotes: ['Yuzu', 'Shiso'],
    heartNotes: ['Green Tea', 'Cucumber'],
    baseNotes: ['Vetiver', 'White Musk'],
    intensity: 2,
    occasions: ['day'],
    seasons: ['spring', 'summer'],
    images: ['/media/products/lorem-10.svg', '/media/products/lorem-10-detail.svg', '/media/products/lorem-10-mood.svg'],
    isFeatured: false,
    sizes: sizes([6200, 8800, 13000], [36, 33, 24])
  },
  {
    slug: 'lorem-ipsum-no-11',
    name: 'Lorem Ipsum No. 11',
    tagline: 'Aenean lacinia bibendum nulla',
    description: lorem,
    audience: 'unisex',
    scentFamily: 'amber',
    topNotes: ['Cardamom', 'Pink Pepper'],
    heartNotes: ['Incense', 'Myrrh'],
    baseNotes: ['Amber', 'Vanilla'],
    intensity: 4,
    occasions: ['night', 'date'],
    seasons: ['autumn', 'winter'],
    images: ['/media/products/lorem-11.svg', '/media/products/lorem-11-detail.svg', '/media/products/lorem-11-mood.svg'],
    isFeatured: true,
    sizes: sizes([8000, 11800, 17600], [21, 23, 13])
  },
  {
    slug: 'lorem-ipsum-no-12',
    name: 'Lorem Ipsum No. 12',
    tagline: 'Etiam porta sem malesuada',
    description: lorem,
    audience: 'unisex',
    scentFamily: 'aromatic',
    topNotes: ['Rosemary', 'Lemon'],
    heartNotes: ['Lavender', 'Clary Sage'],
    baseNotes: ['Oakmoss', 'Tonka Bean'],
    intensity: 3,
    occasions: ['day', 'formal'],
    seasons: ['spring', 'autumn'],
    images: ['/media/products/lorem-12.svg', '/media/products/lorem-12-detail.svg', '/media/products/lorem-12-mood.svg'],
    isFeatured: false,
    sizes: sizes([7000, 10000, 14800], [28, 25, 18])
  }
]

const upsertCatalog = sqlite.transaction(() => {
  for (const item of catalog) {
    const { sizes: itemSizes, ...product } = item

    db.insert(productsTable)
      .values(product)
      .onConflictDoUpdate({
        target: productsTable.slug,
        set: {
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          audience: product.audience,
          scentFamily: product.scentFamily,
          topNotes: product.topNotes,
          heartNotes: product.heartNotes,
          baseNotes: product.baseNotes,
          intensity: product.intensity,
          occasions: product.occasions,
          seasons: product.seasons,
          images: product.images,
          isFeatured: product.isFeatured
        }
      })
      .run()

    const row = db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, product.slug))
      .get()

    if (!row) throw new Error(`Product missing after upsert: ${product.slug}`)

    for (const size of itemSizes) {
      db.insert(productSizes)
        .values({ productId: row.id, ...size })
        .onConflictDoUpdate({
          target: [productSizes.productId, productSizes.sizeMl],
          set: { priceCents: size.priceCents, stock: size.stock }
        })
        .run()
    }
  }
})

upsertCatalog()

const productCount = db.select().from(productsTable).all().length
console.log(`Seeded ${productCount} products.`)

const adminEmail = process.env.NUXT_ADMIN_EMAIL
const adminPassword = process.env.NUXT_ADMIN_PASSWORD

if (adminEmail && adminPassword) {
  const { Hash } = await import('@adonisjs/hash')
  const { Scrypt } = await import('@adonisjs/hash/drivers/scrypt')
  const passwordHash = await new Hash(new Scrypt({})).make(adminPassword)

  db.insert(users)
    .values({ email: adminEmail, passwordHash, name: 'Admin', isAdmin: true })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, isAdmin: true }
    })
    .run()

  console.log(`Seeded admin user ${adminEmail}.`)
} else {
  console.log('Skipped admin seed: set NUXT_ADMIN_EMAIL and NUXT_ADMIN_PASSWORD to create one.')
}
