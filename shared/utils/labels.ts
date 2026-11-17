import type { Audience, DeliveryMethod, Occasion, OrderStatus, PaymentMethod, ScentFamily, Season } from '../types'

export const audienceLabels: Record<Audience, string> = {
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex'
}

export const scentFamilyLabels: Record<ScentFamily, string> = {
  floral: 'Floral',
  woody: 'Woody',
  amber: 'Oriental / Amber',
  fresh: 'Fresh / Citrus',
  gourmand: 'Gourmand',
  aromatic: 'Aromatic'
}

export const occasionLabels: Record<Occasion, string> = {
  day: 'Day',
  night: 'Night',
  date: 'Date',
  office: 'Office',
  formal: 'Formal'
}

export const seasonLabels: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter'
}

export const intensityLabels = ['Subtle', 'Soft', 'Balanced', 'Strong', 'Intense'] as const

export const orderStatusLabels: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered'
}

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  standard: 'Standard delivery',
  express: 'Express delivery'
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  card: 'Card (demo)'
}
