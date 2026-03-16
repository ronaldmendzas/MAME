import type { Context } from 'hono'

import { removeVote } from '../../application/vote-on-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createVoteRepository } from '../../infrastructure/db/vote-repository.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

export async function handleRemoveVote(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  await removeVote(
    { reportId, tokenId },
    { voteRepo: createVoteRepository(db), reportRepo: createReportRepository(db) },
  )

  return c.json({ success: true })
}
