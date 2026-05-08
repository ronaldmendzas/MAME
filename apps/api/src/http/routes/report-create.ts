import type { Context } from 'hono'
import { z } from 'zod'

import { createReport } from '../../application/create-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'
import { REPORT_CATEGORIES } from './report-feed.js'

const createSchema = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(100).max(5000),
  category: z.enum(REPORT_CATEGORIES),
  faculty: z.string().min(1),
})

export async function handleCreateReport(c: Context<AppEnv>) {
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
}
