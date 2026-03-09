import type { Context } from 'hono'
import { z } from 'zod'

import { NotFoundError, ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

export const REPORT_CATEGORIES = [
  'sexual-harassment',
  'academic-corruption',
  'faculty-plagiarism',
  'discrimination',
  'nepotism',
  'administrative-irregularities',
  'fraud',
  'other',
] as const

const filtersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(REPORT_CATEGORIES).optional(),
  faculty: z.string().min(1).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
})

export async function handleFeed(c: Context<AppEnv>) {
  const parsed = filtersSchema.safeParse(c.req.query())
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid feed params')
  }
  const query = parsed.data
  const db = createDb(c.env.DATABASE_URL)
  const repo = createReportRepository(db)

  const rows = await repo.findPublished(
    query.cursor ?? null, query.limit + 1,
    { category: query.category, faculty: query.faculty, dateFrom: query.date_from, dateTo: query.date_to },
  )

  const hasMore = rows.length > query.limit
  const data = hasMore ? rows.slice(0, query.limit) : rows
  const nextCursor = hasMore
    ? data[data.length - 1]?.publishedAt?.toISOString() ?? null
    : null

  return c.json({ success: true, data, nextCursor, hasMore })
}

export async function handleReportDetail(c: Context<AppEnv>) {
  const db = createDb(c.env.DATABASE_URL)
  const repo = createReportRepository(db)
  const report = await repo.findById(c.req.param('id'))

  if (!report || report.status !== 'published') {
    throw new NotFoundError('Report')
  }

  return c.json({ success: true, data: report })
}

export async function handleMyReports(c: Context<AppEnv>) {
  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const cursor = c.req.query('cursor') ?? null
  const limit = Number(c.req.query('limit') ?? '20')
  const db = createDb(c.env.DATABASE_URL)
  const repo = createReportRepository(db)

  const rows = await repo.findByTokenId(tokenId, cursor, limit + 1)
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore
    ? data[data.length - 1]?.createdAt.toISOString() ?? null
    : null

  return c.json({ success: true, data, nextCursor, hasMore })
}
