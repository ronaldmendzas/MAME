import type { Context } from 'hono'
import { z } from 'zod'

import { uploadEvidence } from '../../application/upload-evidence.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'
import { createCloudinaryStorage } from '../../infrastructure/storage/cloudinary.js'

const uuidSchema = z.string().uuid()

export async function handleEvidenceUpload(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')
  if (!uuidSchema.safeParse(reportId).success) {
    throw new ValidationError('Invalid report ID')
  }

  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) {
    throw new ValidationError('Missing file in request body')
  }

  const buffer = await file.arrayBuffer()
  const db = createDb(c.env.DATABASE_URL)
  const storage = createCloudinaryStorage({
    cloudName: c.env.CLOUDINARY_CLOUD_NAME,
    apiKey: c.env.CLOUDINARY_API_KEY,
    apiSecret: c.env.CLOUDINARY_API_SECRET,
  })

  const row = await uploadEvidence(
    { reportId, file: buffer, filename: file.name },
    { storage, evidenceRepo: createEvidenceRepository(db) },
  )

  return c.json({ success: true, data: row }, 201)
}
