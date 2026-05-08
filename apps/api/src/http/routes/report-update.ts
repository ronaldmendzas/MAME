import type { Context } from 'hono'
import { z } from 'zod'

import { updateReport } from '../../application/update-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

const updateSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  body: z.string().min(100).max(5000).optional(),
})

export async function handleUpdateReport(c: Context<AppEnv>) {
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
}
