import type { Context } from 'hono'
import { z } from 'zod'

import { addExternalLink } from '../../application/add-external-link.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'

const bodySchema = z.object({ url: z.string() })
const uuidSchema = z.string().uuid()

export async function handleAddLink(c: Context<AppEnv>): Promise<Response> {
  const reportId = c.req.param('id')
  if (!uuidSchema.safeParse(reportId).success) {
    throw new ValidationError('Invalid report ID')
  }

  const raw = await c.req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) throw new ValidationError('Missing url field')

  const db = createDb(c.env.DATABASE_URL)
  const row = await addExternalLink(
    { reportId, url: parsed.data.url },
    { evidenceRepo: createEvidenceRepository(db) },
  )

  return c.json({ success: true, data: row }, 201)
}
