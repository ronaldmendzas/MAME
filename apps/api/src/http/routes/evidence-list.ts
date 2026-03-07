import type { Context } from 'hono'
import { z } from 'zod'

import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'
import { createCloudinaryStorage } from '../../infrastructure/storage/cloudinary.js'

const uuidSchema = z.string().uuid()

export async function handleEvidenceList(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!uuidSchema.safeParse(reportId).success) {
    throw new ValidationError('Invalid report ID')
  }

  const db = createDb(c.env.DATABASE_URL)
  const evidenceRepo = createEvidenceRepository(db)
  const rows = await evidenceRepo.findByReportId(reportId)

  const storage = createCloudinaryStorage({
    cloudName: c.env.CLOUDINARY_CLOUD_NAME,
    apiKey: c.env.CLOUDINARY_API_KEY,
    apiSecret: c.env.CLOUDINARY_API_SECRET,
  })

  const data = rows.map((row) => ({
    ...row,
    url: storage.getSignedUrl(row.fileKey),
  }))

  return c.json({ success: true, data })
}
