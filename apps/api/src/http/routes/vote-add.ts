import type { Context } from 'hono'

import { voteOnReport } from '../../application/vote-on-report.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createVoteRepository } from '../../infrastructure/db/vote-repository.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

export async function handleAddVote(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')
  const tokenId = c.get('tokenId')
  if (!tokenId) throw new ValidationError('Missing token_id in JWT')

  const db = createDb(c.env.DATABASE_URL)
  const result = await voteOnReport(
    { reportId, tokenId },
    { voteRepo: createVoteRepository(db), reportRepo: createReportRepository(db) },
  )

  return c.json({ success: true, data: result }, 201)
}
