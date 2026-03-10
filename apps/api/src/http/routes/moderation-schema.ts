import { z } from 'zod'

export const moderateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
})
