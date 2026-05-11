import type { Context } from 'hono'
import { z } from 'zod'

import { ValidationError } from '../../domain/errors.js'
import { signMediaUrl } from '../../domain/media-signature.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'

const uuidSchema = z.string().uuid()

export async function handleEvidenceList(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')
  if (!uuidSchema.safeParse(reportId).success) {
    throw new ValidationError('Invalid report ID')
  }

  const db = createDb(c.env.DATABASE_URL)
  const evidenceRepo = createEvidenceRepository(db)
  const rows = await evidenceRepo.findByReportId(reportId)

  const baseUrl = new URL(c.req.url).origin
  const secret = c.env.ENCRYPTION_MASTER_KEY

  const data = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      url: await signMediaUrl(baseUrl, row.fileKey, secret),
    })),
  )

  return c.json({ success: true, data })
}
