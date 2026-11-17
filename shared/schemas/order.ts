import { z } from 'zod'
import { DELIVERY_METHODS, ORDER_STATUSES, PAYMENT_METHODS } from '../types'

export const checkoutSchema = z.object({
  shipName: z.string().trim().min(2).max(80),
  shipPhone: z.string().trim().min(6).max(30).regex(/^[\d+()\-\s]+$/, 'Enter a phone number using digits, spaces, +, - or parentheses.'),
  shipLine1: z.string().trim().min(3).max(120),
  shipLine2: z.string().trim().max(120).optional(),
  shipCity: z.string().trim().min(2).max(80),
  shipPostalCode: z.string().trim().min(3).max(16),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS)
}).strict()

export type CheckoutInput = z.infer<typeof checkoutSchema>

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(60).optional()
}).strict()

export const orderIdSchema = z.coerce.number().int().positive()
