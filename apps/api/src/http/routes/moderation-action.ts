import type { Context } from 'hono'
import { z } from 'zod'

import { moderateReport } from '../../application/moderate-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'
import { createModerationLogRepository } from '../../infrastructure/db/moderation-log-repository.js'
import { createStatusHistoryRepository } from '../../infrastructure/db/status-history-repository.js'

const moderateSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_info', 'escalate']),
  reason: z.string().nullable().optional(),
  moderatorFaculty: z.string().min(1),
})

export async function handleModerateReport(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  const raw = await c.req.json()
  const parsed = moderateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const moderatorToken = c.get('tokenId')
  if (!moderatorToken) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const result = await moderateReport(
    {
      reportId,
      moderatorToken,
      moderatorFaculty: parsed.data.moderatorFaculty,
      action: parsed.data.action,
      reason: parsed.data.reason ?? null,
    },
    {
      reportRepo: createReportRepository(db),
      moderationLogRepo: createModerationLogRepository(db),
      statusHistoryRepo: createStatusHistoryRepository(db),
    },
  )

  return c.json({ success: true, data: result })
}
