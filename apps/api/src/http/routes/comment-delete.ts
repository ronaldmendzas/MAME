import type { Context } from 'hono'

import { ForbiddenError, NotFoundError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createCommentRepository } from '../../infrastructure/db/comment-repository.js'

export async function handleDeleteComment(c: Context<AppEnv>) {
  const commentId = c.req.param('commentId')
  const tokenId = c.get('tokenId')

  const db = createDb(c.env.DATABASE_URL)
  const commentRepo = createCommentRepository(db)

  const comment = await commentRepo.findById(commentId)
  if (!comment) throw new NotFoundError('Comment')

  const isAuthor = comment.tokenId === tokenId
  if (!isAuthor) throw new ForbiddenError('Only the author can delete this comment')

  await commentRepo.deleteById(commentId)

  return c.json({ success: true })
}
