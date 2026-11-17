import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'
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

async function readOrder(orderId: number, userId?: number): Promise<Order> {
  const [row] = await db.select().from(orders).where(
    userId === undefined
      ? eq(orders.id, orderId)
      : and(eq(orders.id, orderId), eq(orders.userId, userId))
  ).limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderStatusEvents)
      .where(eq(orderStatusEvents.orderId, orderId))
      .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id))
  ])

  return toOrder(row, items, events)
}

export async function createOrder(userId: number, input: CheckoutInput): Promise<Order> {
  const orderId = await db.transaction(async (tx) => {
    const [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1)
    const lines = cart ? await tx.select().from(cartItems).where(eq(cartItems.cartId, cart.id)) : []

    if (!cart || lines.length === 0) {
      throw createError({ statusCode: 422, statusMessage: 'Bag is empty', message: 'Your bag is empty.' })
    }

    const snapshots: {
      productId: number
      sizeMl: number
      quantity: number
      name: string
      slug: string
      image: string | null
      priceCents: number
    }[] = []

    for (const line of lines) {
      const [product] = await tx.select().from(products)
        .where(eq(products.id, line.productId))
        .limit(1)

      if (!product) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Item unavailable',
          message: 'An item in your bag is no longer available.'
        })
      }

      const [decremented] = await tx.update(productSizes)
        .set({ stock: sql<number>`${productSizes.stock} - ${line.quantity}` })
        .where(and(
          eq(productSizes.productId, line.productId),
          eq(productSizes.sizeMl, line.sizeMl),
          gte(productSizes.stock, line.quantity)
        ))
        .returning({ priceCents: productSizes.priceCents })

      if (!decremented) {
        const [current] = await tx.select({ stock: productSizes.stock }).from(productSizes).where(and(
          eq(productSizes.productId, line.productId),
          eq(productSizes.sizeMl, line.sizeMl)
        )).limit(1)

        throw createError({
          statusCode: 409,
          statusMessage: 'Insufficient stock',
          message: `Only ${current?.stock ?? 0} left of ${product.name} (${line.sizeMl} ml).`
        })
      }

      snapshots.push({
        productId: product.id,
        sizeMl: line.sizeMl,
        quantity: line.quantity,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? null,
        priceCents: decremented.priceCents
      })
    }

    const subtotalCents = snapshots.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
    const shippingCents = shippingForDelivery(subtotalCents, input.deliveryMethod)
    const totalCents = subtotalCents + shippingCents
    const now = new Date()

    const [created] = await tx.insert(orders).values({
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
    }).returning({ id: orders.id })

    if (!created) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Order failed',
        message: 'Your order could not be placed. Please try again.'
      })
    }

    await tx.update(orders)
      .set({ orderNumber: `PP-${now.getFullYear()}-${String(created.id).padStart(6, '0')}` })
      .where(eq(orders.id, created.id))

    for (const item of snapshots) {
      await tx.insert(orderItems).values({
        orderId: created.id,
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        sizeMl: item.sizeMl,
        unitPriceCents: item.priceCents,
        quantity: item.quantity,
        lineTotalCents: item.priceCents * item.quantity
      })
    }

    await tx.insert(orderStatusEvents).values({
      orderId: created.id,
      status: 'placed',
      note: null,
      createdAt: now
    })

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    await tx.update(carts).set({ updatedAt: now }).where(eq(carts.id, cart.id))

    return created.id
  })

  return readOrder(orderId, userId)
}

export async function listUserOrders(userId: number): Promise<OrderSummary[]> {
  const rows = await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt), desc(orders.id))

  if (rows.length === 0) return []

  const itemRows = await db.select().from(orderItems)
    .where(inArray(orderItems.orderId, rows.map(row => row.id)))

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

export async function getUserOrder(userId: number, orderId: number): Promise<Order> {
  return readOrder(orderId, userId)
}

export async function advanceOrderStatus(orderId: number, status: OrderStatus, trackingNumber?: string): Promise<Order> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)

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

  await db.transaction(async (tx) => {
    const [updated] = await tx.update(orders)
      .set({
        status,
        updatedAt: now,
        ...(tracking ? { trackingNumber: tracking } : {})
      })
      .where(and(eq(orders.id, orderId), eq(orders.status, row.status)))
      .returning({ id: orders.id })

    if (!updated) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Invalid status change',
        message: 'Order status can only move forward.'
      })
    }

    await tx.insert(orderStatusEvents).values({
      orderId,
      status,
      note: null,
      createdAt: now
    })
  })

  return readOrder(orderId)
}
