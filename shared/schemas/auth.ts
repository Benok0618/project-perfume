import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(160),
  password: z.string().min(1).max(200)
}).strict()

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase().max(160),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(200)
}).strict()

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
