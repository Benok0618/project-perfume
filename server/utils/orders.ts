import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { cartItems, carts, orderItems, orderStatusEvents, orders, productSizes, products } from '../db/schema'
import type { CheckoutInput } from '../../shared/schemas/order'
import type { Order, OrderItem, OrderStatus, OrderSummary } from '../../shared/types'
import { ORDER_STATUSES } from '../../shared/types'
import { shippingForDelivery } from '../../shared/utils/cart'

type OrderRow = typeof orders.$inferSelect
type OrderItemRow = typeof orderItems.$inferSelect
type OrderEventRow = typeof orderStatusEvents.$inferSelect

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.productId ?? null,
    name: row.name,
    slug: row.slug,
    image: row.image ?? null,
    sizeMl: row.sizeMl,
    unitPriceCents: row.unitPriceCents,
    quantity: row.quantity,
    lineTotalCents: row.lineTotalCents
  }
}

function toOrder(row: OrderRow, items: OrderItemRow[], events: OrderEventRow[]): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
    deliveryMethod: row.deliveryMethod,
    paymentMethod: row.paymentMethod,
    trackingNumber: row.trackingNumber ?? null,
    shipName: row.shipName,
    shipPhone: row.shipPhone,
    shipLine1: row.shipLine1,
    shipLine2: row.shipLine2 ?? null,
    shipCity: row.shipCity,
    shipPostalCode: row.shipPostalCode,
    createdAt: row.createdAt.toISOString(),
    items: items.map(toOrderItem),
    events: events.map(event => ({
      status: event.status,
      note: event.note ?? null,
      createdAt: event.createdAt.toISOString()
    }))
  }
}

function readOrder(orderId: number, userId?: number): Order {
  const row = db.select().from(orders).where(
    userId === undefined
      ? eq(orders.id, orderId)
      : and(eq(orders.id, orderId), eq(orders.userId, userId))
  ).get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const items = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all()
  const events = db.select().from(orderStatusEvents)
    .where(eq(orderStatusEvents.orderId, orderId))
    .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id))
    .all()

  return toOrder(row, items, events)
}

export function createOrder(userId: number, input: CheckoutInput): Order {
  const orderId = db.transaction((tx) => {
    const cart = tx.select().from(carts).where(eq(carts.userId, userId)).get()
    const lines = cart ? tx.select().from(cartItems).where(eq(cartItems.cartId, cart.id)).all() : []

    if (!cart || lines.length === 0) {
      throw createError({ statusCode: 422, statusMessage: 'Bag is empty', message: 'Your bag is empty.' })
    }

    const snapshots: {
      size: typeof productSizes.$inferSelect
      name: string
      slug: string
      image: string | null
      quantity: number
    }[] = []

    for (const line of lines) {
      const product = tx.select().from(products).where(eq(products.id, line.productId)).get()
      const size = tx.select().from(productSizes).where(and(
        eq(productSizes.productId, line.productId),
        eq(productSizes.sizeMl, line.sizeMl)
      )).get()

      if (!product || !size) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Item unavailable',
          message: 'An item in your bag is no longer available.'
        })
      }

      if (size.stock < line.quantity) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Insufficient stock',
          message: `Only ${size.stock} left of ${product.name} (${line.sizeMl} ml).`
        })
      }

      snapshots.push({
        size,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? null,
        quantity: line.quantity
      })
    }

    const subtotalCents = snapshots.reduce((sum, item) => sum + item.size.priceCents * item.quantity, 0)
    const shippingCents = shippingForDelivery(subtotalCents, input.deliveryMethod)
    const totalCents = subtotalCents + shippingCents
    const now = new Date()

    const created = tx.insert(orders).values({
      orderNumber: `PENDING-${randomUUID()}`,
      userId,
      status: 'placed',
      subtotalCents,
      shippingCents,
      totalCents,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      trackingNumber: null,
      shipName: input.shipName,
      shipPhone: input.shipPhone,
      shipLine1: input.shipLine1,
      shipLine2: input.shipLine2 || null,
      shipCity: input.shipCity,
      shipPostalCode: input.shipPostalCode,
      createdAt: now,
      updatedAt: now
    }).returning({ id: orders.id }).get()

    if (!created) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Order failed',
        message: 'Your order could not be placed. Please try again.'
      })
    }

    tx.update(orders)
      .set({ orderNumber: `PP-${now.getFullYear()}-${String(created.id).padStart(6, '0')}` })
      .where(eq(orders.id, created.id))
      .run()

    for (const item of snapshots) {
      tx.insert(orderItems).values({
        orderId: created.id,
        productId: item.size.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        sizeMl: item.size.sizeMl,
        unitPriceCents: item.size.priceCents,
        quantity: item.quantity,
        lineTotalCents: item.size.priceCents * item.quantity
      }).run()

      tx.update(productSizes)
        .set({ stock: item.size.stock - item.quantity })
        .where(and(
          eq(productSizes.productId, item.size.productId),
          eq(productSizes.sizeMl, item.size.sizeMl)
        ))
        .run()
    }

    tx.insert(orderStatusEvents).values({
      orderId: created.id,
      status: 'placed',
      note: null,
      createdAt: now
    }).run()

    tx.delete(cartItems).where(eq(cartItems.cartId, cart.id)).run()
    tx.update(carts).set({ updatedAt: now }).where(eq(carts.id, cart.id)).run()

    return created.id
  })

  return readOrder(orderId, userId)
}

export function listUserOrders(userId: number): OrderSummary[] {
  const rows = db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .all()

  if (rows.length === 0) return []

  const itemRows = db.select().from(orderItems)
    .where(inArray(orderItems.orderId, rows.map(row => row.id)))
    .all()

  const grouped = new Map<number, OrderItemRow[]>()

  for (const item of itemRows) {
    const list = grouped.get(item.orderId) ?? []
    list.push(item)
    grouped.set(item.orderId, list)
  }

  return rows.map((row) => {
    const items = grouped.get(row.id) ?? []

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      totalCents: row.totalCents,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: row.createdAt.toISOString(),
      image: items[0]?.image ?? null,
      trackingNumber: row.trackingNumber ?? null
    }
  })
}

export function getUserOrder(userId: number, orderId: number): Order {
  return readOrder(orderId, userId)
}

export function advanceOrderStatus(orderId: number, status: OrderStatus, trackingNumber?: string): Order {
  const row = db.select().from(orders).where(eq(orders.id, orderId)).get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const currentIndex = ORDER_STATUSES.indexOf(row.status)
  const targetIndex = ORDER_STATUSES.indexOf(status)

  if (targetIndex <= currentIndex) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Invalid status change',
      message: 'Order status can only move forward.'
    })
  }

  const now = new Date()
  const tracking = trackingNumber?.trim()

  db.transaction((tx) => {
    tx.update(orders)
      .set({
        status,
        updatedAt: now,
        ...(tracking ? { trackingNumber: tracking } : {})
      })
      .where(eq(orders.id, orderId))
      .run()

    tx.insert(orderStatusEvents).values({
      orderId,
      status,
      note: null,
      createdAt: now
    }).run()
  })

  return readOrder(orderId)
}
