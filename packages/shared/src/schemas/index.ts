import { z } from 'zod'

import {
  MAX_BODY_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_BODY_LENGTH,
  MIN_TITLE_LENGTH,
  REPORT_CATEGORIES,
} from '../constants/index.js'

export const createReportSchema = z.object({
  title: z.string().min(MIN_TITLE_LENGTH).max(MAX_TITLE_LENGTH),
  body: z.string().min(MIN_BODY_LENGTH).max(MAX_BODY_LENGTH),
  category: z.enum(REPORT_CATEGORIES),
  faculty: z.string().min(1),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

export const createCommentSchema = z.object({
  reportId: z.string().uuid(),
  body: z.string().min(1).max(MAX_COMMENT_LENGTH),
  parentId: z.string().uuid().optional(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>
