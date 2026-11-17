import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { cartItems, carts, productSizes, products } from '../db/schema'
import type { CartInputItem, CartLine, CartSummary, ProductSize } from '../../shared/types'
import { MAX_CART_QUANTITY } from '../../shared/schemas/cart'
import { shippingForSubtotal } from '../../shared/utils/cart'

function emptySummary(): CartSummary {
  return {
    items: [],
    itemCount: 0,
    subtotalCents: 0,
    shippingCents: 0,
    totalCents: 0
  }
}

function normalizeItems(items: CartInputItem[]) {
  const merged = new Map<string, CartInputItem>()

  for (const item of items) {
    const key = `${item.productId}:${item.sizeMl}`
    const existing = merged.get(key)
    if (existing) {
      existing.quantity = Math.min(MAX_CART_QUANTITY, existing.quantity + item.quantity)
    } else {
      merged.set(key, { ...item, quantity: Math.min(MAX_CART_QUANTITY, item.quantity) })
    }
  }

  return [...merged.values()]
}

export async function buildCartSummary(input: CartInputItem[]): Promise<CartSummary> {
  const items = normalizeItems(input)
  if (items.length === 0) return emptySummary()

  const productIds = [...new Set(items.map(item => item.productId))]
  const [productRows, sizeRows] = await Promise.all([
    db.select().from(products).where(inArray(products.id, productIds)),
    db.select().from(productSizes).where(inArray(productSizes.productId, productIds))
  ])

  const productMap = new Map(productRows.map(row => [row.id, row]))
  const sizeMap = new Map(sizeRows.map(row => [`${row.productId}:${row.sizeMl}`, row]))
  const sizesByProduct = new Map<number, ProductSize[]>()

  for (const size of sizeRows) {
    const list = sizesByProduct.get(size.productId) ?? []
    list.push({ sizeMl: size.sizeMl, priceCents: size.priceCents, stock: size.stock })
    sizesByProduct.set(size.productId, list)
  }

  const lines: CartLine[] = []

  for (const item of items) {
    const product = productMap.get(item.productId)
    const size = sizeMap.get(`${item.productId}:${item.sizeMl}`)
    if (!product || !size || size.stock <= 0) continue

    const quantity = Math.min(item.quantity, size.stock, MAX_CART_QUANTITY)
    if (quantity <= 0) continue

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? '',
      sizeMl: size.sizeMl,
      unitPriceCents: size.priceCents,
      quantity,
      stock: size.stock,
      lineTotalCents: size.priceCents * quantity,
      sizes: (sizesByProduct.get(product.id) ?? []).sort((a, b) => a.sizeMl - b.sizeMl)
    })
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0)
  const shippingCents = shippingForSubtotal(subtotalCents)

  return {
    items: lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents
  }
}

async function ensureCart(userId: number) {
  const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1)
  if (existing) return existing

  await db.insert(carts).values({ userId }).onConflictDoNothing({ target: carts.userId })

  const [created] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1)

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Could not create cart' })
  }

  return created
}

async function readCartItems(cartId: number): Promise<CartInputItem[]> {
  return db.select({
    productId: cartItems.productId,
    sizeMl: cartItems.sizeMl,
    quantity: cartItems.quantity
  }).from(cartItems).where(eq(cartItems.cartId, cartId))
}

async function findSize(productId: number, sizeMl: number) {
  const [size] = await db.select().from(productSizes).where(and(
    eq(productSizes.productId, productId),
    eq(productSizes.sizeMl, sizeMl)
  )).limit(1)

  if (!size) {
    throw createError({ statusCode: 404, statusMessage: 'Product size not found' })
  }
  return size
}

async function requireStock(productId: number, sizeMl: number) {
  const size = await findSize(productId, sizeMl)
  if (size.stock <= 0) {
    throw createError({ statusCode: 409, statusMessage: 'This size is out of stock' })
  }
  return size
}

async function touchCart(cartId: number) {
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId))
}

export async function getUserCartSummary(userId: number): Promise<CartSummary> {
  const cart = await ensureCart(userId)
  return buildCartSummary(await readCartItems(cart.id))
}

export async function addUserCartItem(userId: number, input: CartInputItem): Promise<CartSummary> {
  const size = await requireStock(input.productId, input.sizeMl)
  const cart = await ensureCart(userId)

  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(cartItems).where(and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, input.productId),
      eq(cartItems.sizeMl, input.sizeMl)
    )).limit(1)

    const quantity = Math.min(size.stock, MAX_CART_QUANTITY, (existing?.quantity ?? 0) + input.quantity)

    if (existing) {
      await tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, existing.id))
    } else {
      await tx.insert(cartItems).values({
        cartId: cart.id,
        productId: input.productId,
        sizeMl: input.sizeMl,
        quantity
      })
    }

    await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id))
  })

  return buildCartSummary(await readCartItems(cart.id))
}

export async function updateUserCartItem(userId: number, input: {
  productId: number
  sizeMl: number
  quantity?: number
  newSizeMl?: number
}): Promise<CartSummary> {
  const cart = await ensureCart(userId)
  const [source] = await db.select().from(cartItems).where(and(
    eq(cartItems.cartId, cart.id),
    eq(cartItems.productId, input.productId),
    eq(cartItems.sizeMl, input.sizeMl)
  )).limit(1)

  if (!source) {
    throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })
  }

  const targetSizeMl = input.newSizeMl ?? input.sizeMl
  const targetSize = await requireStock(input.productId, targetSizeMl)
  const requested = input.quantity ?? source.quantity

  await db.transaction(async (tx) => {
    if (targetSizeMl === input.sizeMl) {
      await tx.update(cartItems)
        .set({ quantity: Math.min(requested, targetSize.stock, MAX_CART_QUANTITY) })
        .where(eq(cartItems.id, source.id))
    } else {
      const [target] = await tx.select().from(cartItems).where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, input.productId),
        eq(cartItems.sizeMl, targetSizeMl)
      )).limit(1)

      const quantity = Math.min(targetSize.stock, MAX_CART_QUANTITY, (target?.quantity ?? 0) + requested)

      await tx.delete(cartItems).where(eq(cartItems.id, source.id))

      if (target) {
        await tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, target.id))
      } else {
        await tx.insert(cartItems).values({
          cartId: cart.id,
          productId: input.productId,
          sizeMl: targetSizeMl,
          quantity
        })
      }
    }

    await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id))
  })

  return buildCartSummary(await readCartItems(cart.id))
}

export async function removeUserCartItem(userId: number, productId: number, sizeMl: number): Promise<CartSummary> {
  const cart = await ensureCart(userId)

  await db.delete(cartItems).where(and(
    eq(cartItems.cartId, cart.id),
    eq(cartItems.productId, productId),
    eq(cartItems.sizeMl, sizeMl)
  ))

  await touchCart(cart.id)

  return buildCartSummary(await readCartItems(cart.id))
}

export async function mergeUserCart(userId: number, items: CartInputItem[]): Promise<CartSummary> {
  const cart = await ensureCart(userId)
  const merged = normalizeItems(items)

  await db.transaction(async (tx) => {
    for (const item of merged) {
      const [size] = await tx.select().from(productSizes).where(and(
        eq(productSizes.productId, item.productId),
        eq(productSizes.sizeMl, item.sizeMl)
      )).limit(1)

      if (!size || size.stock <= 0) continue

      const [existing] = await tx.select().from(cartItems).where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, item.productId),
        eq(cartItems.sizeMl, item.sizeMl)
      )).limit(1)

      const quantity = Math.min(size.stock, MAX_CART_QUANTITY, (existing?.quantity ?? 0) + item.quantity)

      if (existing) {
        await tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, existing.id))
      } else {
        await tx.insert(cartItems).values({
          cartId: cart.id,
          productId: item.productId,
          sizeMl: item.sizeMl,
          quantity
        })
      }
    }

    await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id))
  })

  return buildCartSummary(await readCartItems(cart.id))
}
