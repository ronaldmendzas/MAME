import type { Context } from 'hono'

import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createCommentRepository } from '../../infrastructure/db/comment-repository.js'
import { createDb } from '../../infrastructure/db/connection.js'

export async function handleGetComments(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')
  const db = createDb(c.env.DATABASE_URL)
  const commentRepo = createCommentRepository(db)

  const rows = await commentRepo.findByReportId(reportId)

  return c.json({ success: true, data: rows })
}
