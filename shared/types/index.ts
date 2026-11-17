export const AUDIENCES = ['men', 'women', 'unisex'] as const
export type Audience = (typeof AUDIENCES)[number]

export const SCENT_FAMILIES = ['floral', 'woody', 'amber', 'fresh', 'gourmand', 'aromatic'] as const
export type ScentFamily = (typeof SCENT_FAMILIES)[number]

export const OCCASIONS = ['day', 'night', 'date', 'office', 'formal'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
export type Season = (typeof SEASONS)[number]

export const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type SizeMl = 30 | 50 | 100

export interface ProductSize {
  sizeMl: number
  priceCents: number
  stock: number
}

export interface Product {
  id: number
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
  sizes: ProductSize[]
}

export interface SessionUser {
  id: number
  email: string
  name: string
  isAdmin: boolean
}

export interface CartInputItem {
  productId: number
  sizeMl: number
  quantity: number
}

export interface CartLine {
  productId: number
  slug: string
  name: string
  image: string
  sizeMl: number
  unitPriceCents: number
  quantity: number
  stock: number
  lineTotalCents: number
  sizes: ProductSize[]
}

export interface CartSummary {
  items: CartLine[]
  itemCount: number
  subtotalCents: number
  shippingCents: number
  totalCents: number
}

export const DELIVERY_METHODS = ['standard', 'express'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const PAYMENT_METHODS = ['cod', 'card'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface OrderStatusEvent {
  status: OrderStatus
  note: string | null
  createdAt: string
}

export interface OrderItem {
  id: number
  productId: number | null
  name: string
  slug: string
  image: string | null
  sizeMl: number
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
}

export interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  subtotalCents: number
  shippingCents: number
  totalCents: number
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  trackingNumber: string | null
  shipName: string
  shipPhone: string
  shipLine1: string
  shipLine2: string | null
  shipCity: string
  shipPostalCode: string
  createdAt: string
  items: OrderItem[]
  events: OrderStatusEvent[]
}

export interface OrderSummary {
  id: number
  orderNumber: string
  status: OrderStatus
  totalCents: number
  itemCount: number
  createdAt: string
  image: string | null
  trackingNumber: string | null
}

export const QUIZ_QUESTION_IDS = ['time', 'season', 'vibe', 'place', 'occasion', 'intensity', 'avoid'] as const
export type QuizQuestionId = (typeof QUIZ_QUESTION_IDS)[number]

export interface QuizMatch {
  product: Product
  matchPercent: number
}

export interface QuizResult {
  audience: Audience
  answers: Record<string, string>
  match: QuizMatch | null
  runnerUps: QuizMatch[]
  eligibleCount: number
  createdAt: string
}
