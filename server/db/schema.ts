import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Audience, DeliveryMethod, Occasion, OrderStatus, PaymentMethod, ScentFamily, Season } from '../../shared/types'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  audience: text('audience').$type<Audience>().notNull(),
  scentFamily: text('scent_family').$type<ScentFamily>().notNull(),
  topNotes: text('top_notes', { mode: 'json' }).$type<string[]>().notNull(),
  heartNotes: text('heart_notes', { mode: 'json' }).$type<string[]>().notNull(),
  baseNotes: text('base_notes', { mode: 'json' }).$type<string[]>().notNull(),
  intensity: integer('intensity').notNull(),
  occasions: text('occasions', { mode: 'json' }).$type<Occasion[]>().notNull(),
  seasons: text('seasons', { mode: 'json' }).$type<Season[]>().notNull(),
  images: text('images', { mode: 'json' }).$type<string[]>().notNull(),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, table => [
  index('products_audience_idx').on(table.audience),
  index('products_family_idx').on(table.scentFamily)
])

export const productSizes = sqliteTable('product_sizes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sizeMl: integer('size_ml').notNull(),
  priceCents: integer('price_cents').notNull(),
  stock: integer('stock').notNull().default(0)
}, table => [
  uniqueIndex('product_sizes_product_size_idx').on(table.productId, table.sizeMl)
])

export const carts = sqliteTable('carts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sizeMl: integer('size_ml').notNull(),
  quantity: integer('quantity').notNull().default(1)
}, table => [
  uniqueIndex('cart_items_cart_product_size_idx').on(table.cartId, table.productId, table.sizeMl)
])

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').$type<OrderStatus>().notNull().default('placed'),
  subtotalCents: integer('subtotal_cents').notNull(),
  shippingCents: integer('shipping_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  deliveryMethod: text('delivery_method').$type<DeliveryMethod>().notNull(),
  paymentMethod: text('payment_method').$type<PaymentMethod>().notNull(),
  trackingNumber: text('tracking_number'),
  shipName: text('ship_name').notNull(),
  shipPhone: text('ship_phone').notNull(),
  shipLine1: text('ship_line1').notNull(),
  shipLine2: text('ship_line2'),
  shipCity: text('ship_city').notNull(),
  shipPostalCode: text('ship_postal_code').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, table => [
  index('orders_user_created_idx').on(table.userId, table.createdAt)
])

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  image: text('image'),
  sizeMl: integer('size_ml').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotalCents: integer('line_total_cents').notNull()
}, table => [
  index('order_items_order_idx').on(table.orderId)
])

export const orderStatusEvents = sqliteTable('order_status_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').$type<OrderStatus>().notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, table => [
  index('order_status_events_order_idx').on(table.orderId)
])

export const quizResults = sqliteTable('quiz_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  audience: text('audience').$type<Audience>().notNull(),
  answers: text('answers', { mode: 'json' }).$type<Record<string, string>>().notNull(),
  scores: text('scores', { mode: 'json' }).$type<Record<string, number>>().notNull(),
  topProductId: integer('top_product_id').references(() => products.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes)
}))

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id]
  })
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id]
  }),
  items: many(cartItems)
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  })
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems),
  events: many(orderStatusEvents)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  })
}))

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusEvents.orderId],
    references: [orders.id]
  })
}))
