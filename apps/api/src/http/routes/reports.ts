import { Hono } from 'hono'
import { z } from 'zod'

import { createReport } from '../../application/create-report.js'
import { updateReport } from '../../application/update-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'
import { authMiddleware } from '../middleware/auth.js'
import { ensureRegisteredMiddleware } from '../middleware/ensure-registered.js'
import { optionalAuthMiddleware } from '../middleware/optional-auth.js'
import { rateLimitWrite } from '../middleware/rate-limit.js'

import {
  REPORT_CATEGORIES,
  handleFeed,
  handleMyReports,
} from './report-feed.js'
import { handleReportDetail } from './report-detail.js'
import { handleEvidenceList } from './evidence-list.js'
import { handleEvidenceUpload } from './evidence.js'
import { handleSearch } from './report-search.js'
import { handleStatusHistory } from './report-history.js'
import { handleSubmitReport } from './report-submit.js'
import { handleAddLink } from './evidence-link.js'

const createSchema = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(100).max(5000),
  category: z.enum(REPORT_CATEGORIES),
  faculty: z.string().min(1),
})

const updateSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  body: z.string().min(100).max(5000).optional(),
})

const reportRoutes = new Hono<AppEnv>()

reportRoutes.get('/', handleFeed)
reportRoutes.get('/search', handleSearch)
reportRoutes.get('/mine', authMiddleware, ensureRegisteredMiddleware, handleMyReports)
reportRoutes.get('/:id', optionalAuthMiddleware, handleReportDetail)
reportRoutes.get('/:id/history', handleStatusHistory)
reportRoutes.get('/:id/evidence', handleEvidenceList)
reportRoutes.post('/:id/evidence', authMiddleware, rateLimitWrite(), handleEvidenceUpload)
reportRoutes.post('/:id/evidence/link', authMiddleware, rateLimitWrite(), handleAddLink)
reportRoutes.post('/:id/submit', authMiddleware, ensureRegisteredMiddleware, rateLimitWrite(), handleSubmitReport)

reportRoutes.post('/', authMiddleware, ensureRegisteredMiddleware, rateLimitWrite(), async (c) => {
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

reportRoutes.patch('/:id', authMiddleware, ensureRegisteredMiddleware, rateLimitWrite(), async (c) => {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')

  const raw = await c.req.json()
  const parsed = updateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const report = await updateReport(
    { reportId, tokenId, ...parsed.data },
    { reportRepo: createReportRepository(db) },
  )

  return c.json({ success: true, data: report })
})

export { reportRoutes }
