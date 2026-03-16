import type { Context } from 'hono'
import { z } from 'zod'

import { createComment } from '../../application/create-comment.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createCommentRepository } from '../../infrastructure/db/comment-repository.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

const commentSchema = z.object({
  body: z.string().min(1).max(1000),
  parentId: z.string().uuid().nullable().optional(),
})

export async function handleCreateComment(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  const raw = await c.req.json()
  const parsed = commentSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const result = await createComment(
    { reportId, tokenId, body: parsed.data.body, parentId: parsed.data.parentId ?? null },
    { commentRepo: createCommentRepository(db), reportRepo: createReportRepository(db) },
  )

  return c.json({ success: true, data: result }, 201)
}
