import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '../../env.js'
import { createReport } from '../../application/create-report.js'
import { ValidationError } from '../../domain/errors.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimitWrite } from '../middleware/rate-limit.js'

const REPORT_CATEGORIES = [
  'sexual-harassment',
  'academic-corruption',
  'faculty-plagiarism',
  'discrimination',
  'nepotism',
  'administrative-irregularities',
  'fraud',
  'other',
] as const

const createSchema = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(100).max(5000),
  category: z.enum(REPORT_CATEGORIES),
  faculty: z.string().min(1),
})

const reportRoutes = new Hono<AppEnv>()

reportRoutes.use('*', authMiddleware)

reportRoutes.post('/', rateLimitWrite(), async (c) => {
  const raw = await c.req.json()
  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const report = await createReport(
    { ...parsed.data, tokenId },
    { reportRepo: createReportRepository(db) },
  )

  return c.json({ success: true, data: report }, 201)
})

export { reportRoutes }
