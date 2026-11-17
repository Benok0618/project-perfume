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

export function buildCartSummary(input: CartInputItem[]): CartSummary {
  const items = normalizeItems(input)
  if (items.length === 0) return emptySummary()

  const productIds = [...new Set(items.map(item => item.productId))]
  const productRows = db.select().from(products).where(inArray(products.id, productIds)).all()
  const sizeRows = db.select().from(productSizes).where(inArray(productSizes.productId, productIds)).all()

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

function ensureCart(userId: number) {
  const existing = db.select().from(carts).where(eq(carts.userId, userId)).get()
  if (existing) return existing

  const created = db.insert(carts).values({ userId }).returning().get()
  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Could not create cart' })
  }
  return created
}

function readCartItems(cartId: number): CartInputItem[] {
  return db.select({
    productId: cartItems.productId,
    sizeMl: cartItems.sizeMl,
    quantity: cartItems.quantity
  }).from(cartItems).where(eq(cartItems.cartId, cartId)).all()
}

function findSize(productId: number, sizeMl: number) {
  const size = db.select().from(productSizes).where(and(
    eq(productSizes.productId, productId),
    eq(productSizes.sizeMl, sizeMl)
  )).get()

  if (!size) {
    throw createError({ statusCode: 404, statusMessage: 'Product size not found' })
  }
  return size
}

function requireStock(productId: number, sizeMl: number) {
  const size = findSize(productId, sizeMl)
  if (size.stock <= 0) {
    throw createError({ statusCode: 409, statusMessage: 'This size is out of stock' })
  }
  return size
}

function touchCart(cartId: number) {
  db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId)).run()
}

export function getUserCartSummary(userId: number): CartSummary {
  const cart = ensureCart(userId)
  return buildCartSummary(readCartItems(cart.id))
}

export function addUserCartItem(userId: number, input: CartInputItem): CartSummary {
  const size = requireStock(input.productId, input.sizeMl)
  const cart = ensureCart(userId)

  db.transaction((tx) => {
    const existing = tx.select().from(cartItems).where(and(
      eq(cartItems.cartId, cart.id),
      eq(cartItems.productId, input.productId),
      eq(cartItems.sizeMl, input.sizeMl)
    )).get()

    const quantity = Math.min(size.stock, MAX_CART_QUANTITY, (existing?.quantity ?? 0) + input.quantity)

    if (existing) {
      tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, existing.id)).run()
    } else {
      tx.insert(cartItems).values({
        cartId: cart.id,
        productId: input.productId,
        sizeMl: input.sizeMl,
        quantity
      }).run()
    }

    tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)).run()
  })

  return buildCartSummary(readCartItems(cart.id))
}

export function updateUserCartItem(userId: number, input: {
  productId: number
  sizeMl: number
  quantity?: number
  newSizeMl?: number
}): CartSummary {
  const cart = ensureCart(userId)
  const source = db.select().from(cartItems).where(and(
    eq(cartItems.cartId, cart.id),
    eq(cartItems.productId, input.productId),
    eq(cartItems.sizeMl, input.sizeMl)
  )).get()

  if (!source) {
    throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })
  }

  const targetSizeMl = input.newSizeMl ?? input.sizeMl
  const targetSize = requireStock(input.productId, targetSizeMl)
  const requested = input.quantity ?? source.quantity

  db.transaction((tx) => {
    if (targetSizeMl === input.sizeMl) {
      tx.update(cartItems)
        .set({ quantity: Math.min(requested, targetSize.stock, MAX_CART_QUANTITY) })
        .where(eq(cartItems.id, source.id))
        .run()
    } else {
      const target = tx.select().from(cartItems).where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, input.productId),
        eq(cartItems.sizeMl, targetSizeMl)
      )).get()

      const quantity = Math.min(targetSize.stock, MAX_CART_QUANTITY, (target?.quantity ?? 0) + requested)

      tx.delete(cartItems).where(eq(cartItems.id, source.id)).run()

      if (target) {
        tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, target.id)).run()
      } else {
        tx.insert(cartItems).values({
          cartId: cart.id,
          productId: input.productId,
          sizeMl: targetSizeMl,
          quantity
        }).run()
      }
    }

    tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)).run()
  })

  return buildCartSummary(readCartItems(cart.id))
}

export function removeUserCartItem(userId: number, productId: number, sizeMl: number): CartSummary {
  const cart = ensureCart(userId)

  db.delete(cartItems).where(and(
    eq(cartItems.cartId, cart.id),
    eq(cartItems.productId, productId),
    eq(cartItems.sizeMl, sizeMl)
  )).run()

  touchCart(cart.id)

  return buildCartSummary(readCartItems(cart.id))
}

export function mergeUserCart(userId: number, items: CartInputItem[]): CartSummary {
  const cart = ensureCart(userId)
  const merged = normalizeItems(items)

  db.transaction((tx) => {
    for (const item of merged) {
      const size = tx.select().from(productSizes).where(and(
        eq(productSizes.productId, item.productId),
        eq(productSizes.sizeMl, item.sizeMl)
      )).get()

      if (!size || size.stock <= 0) continue

      const existing = tx.select().from(cartItems).where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, item.productId),
        eq(cartItems.sizeMl, item.sizeMl)
      )).get()

      const quantity = Math.min(size.stock, MAX_CART_QUANTITY, (existing?.quantity ?? 0) + item.quantity)

      if (existing) {
        tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, existing.id)).run()
      } else {
        tx.insert(cartItems).values({
          cartId: cart.id,
          productId: item.productId,
          sizeMl: item.sizeMl,
          quantity
        }).run()
      }
    }

    tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)).run()
  })

  return buildCartSummary(readCartItems(cart.id))
}
