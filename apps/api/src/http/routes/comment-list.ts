import type { Context } from 'hono'

import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createCommentRepository } from '../../infrastructure/db/comment-repository.js'

export async function handleGetComments(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  const db = createDb(c.env.DATABASE_URL)
  const commentRepo = createCommentRepository(db)

  const rows = await commentRepo.findByReportId(reportId)

  return c.json({ success: true, data: rows })
}
