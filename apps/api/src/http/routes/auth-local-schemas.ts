import { z } from 'zod'

export const registerSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
})

export const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
})

export const mfaBeginSchema = z.object({
  userId: z.string().uuid(),
  accountName: z.string().min(3),
  issuer: z.string().min(1).optional(),
})

export const mfaCodeSchema = z.object({
  userId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
})
