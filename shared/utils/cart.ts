import type { DeliveryMethod } from '../types'

export const SHIPPING_FLAT_CENTS = 1200
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000
export const EXPRESS_SHIPPING_CENTS = 2900

export function shippingForSubtotal(subtotalCents: number) {
  if (subtotalCents <= 0) return 0
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS
}

export function shippingForDelivery(subtotalCents: number, method: DeliveryMethod) {
  if (subtotalCents <= 0) return 0
  if (method === 'express') return EXPRESS_SHIPPING_CENTS
  return shippingForSubtotal(subtotalCents)
}
