import type { Context } from 'hono'
import { submitReport } from '../../application/submit-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'
import { createForensicLogRepository } from '../../infrastructure/db/forensic-log-repository.js'
import { createWorkersAiModeration } from '../../infrastructure/ai/workers-ai-moderation.js'
import { createCloudinaryStorage } from '../../infrastructure/storage/cloudinary.js'

export async function handleSubmitReport(c: Context<AppEnv>): Promise<Response> {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')

  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const result = await submitReport(
    { reportId, tokenId },
    {
      reportRepo: createReportRepository(db),
      evidenceRepo: createEvidenceRepository(db),
      moderation: createWorkersAiModeration(c.env.AI),
      forensicLog: createForensicLogRepository(db),
      storage: createCloudinaryStorage({
        cloudName: c.env.CLOUDINARY_CLOUD_NAME,
        apiKey: c.env.CLOUDINARY_API_KEY,
        apiSecret: c.env.CLOUDINARY_API_SECRET,
      }),
    },
  )

  return c.json({ success: true, data: result })
}
