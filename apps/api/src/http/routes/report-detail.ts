import type { Context } from 'hono'

import { NotFoundError, ValidationError } from '../../domain/errors.js'
import { signMediaUrl } from '../../domain/media-signature.js'
import type { AppEnv } from '../../env.js'
import { createCommentRepository } from '../../infrastructure/db/comment-repository.js'
import { createDb, type Database } from '../../infrastructure/db/connection.js'
import { createEvidenceRepository } from '../../infrastructure/db/evidence-repository.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

export async function handleReportDetail(c: Context<AppEnv>) {
  const reportId = c.req.param('id')
  if (!reportId) throw new ValidationError('Missing report ID')

  const db = createDb(c.env.DATABASE_URL)
  const repo = createReportRepository(db)
  const report = await repo.findById(reportId)

  if (!report) throw new NotFoundError('Report')

  assertCanView(c, report)

  const [evidence, commentCount] = await Promise.all([
    fetchSignedEvidence(c, db, report.id),
    createCommentRepository(db).countByReportId(report.id),
  ])

  return c.json({ success: true, data: { ...report, evidence, commentCount } })
}

function assertCanView(c: Context<AppEnv>, report: { tokenId: string; status: string }) {
  const tokenId = c.get('tokenId') || ''
  const role = c.get('userRole') || ''

  const isAuthor = tokenId !== '' && tokenId === report.tokenId
  const isModerator = role === 'moderator' || role === 'admin'
  const isPublished = report.status === 'published'
  const isUnderReview = report.status === 'under_review'

  if (isPublished || isAuthor || (isModerator && isUnderReview)) return
  throw new NotFoundError('Report')
}

async function fetchSignedEvidence(c: Context<AppEnv>, db: Database, reportId: string) {
  const rows = await createEvidenceRepository(db).findByReportId(reportId)
  const baseUrl = new URL(c.req.url).origin
  const secret = c.env.ENCRYPTION_MASTER_KEY

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      url: await signMediaUrl(baseUrl, row.fileKey, secret),
    })),
  )
}
