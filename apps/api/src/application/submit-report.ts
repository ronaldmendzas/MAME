import type { ReportRepository } from '../domain/ports/report-repository.js'
import type { EvidenceRepository } from '../domain/ports/evidence-repository.js'
import type { ModerationPort } from '../domain/ports/moderation-port.js'
import type { ForensicLogPort } from '../domain/ports/forensic-log-port.js'
import type { StoragePort } from '../domain/ports/storage-port.js'
import { ValidationError, NotFoundError, ForbiddenError } from '../domain/errors.js'
import { computeContentHash } from '../domain/content-hash.js'
import { buildTextPayload } from './moderation-helpers.js'
import { screenImages } from './screen-images.js'

export interface SubmitReportDeps {
  reportRepo: ReportRepository
  evidenceRepo: EvidenceRepository
  moderation: ModerationPort
  forensicLog: ForensicLogPort
  storage: StoragePort
}

export interface SubmitReportInput {
  reportId: string
  tokenId: string
}

export type SubmitResult =
  | { outcome: 'submitted' }
  | { outcome: 'rejected'; reason: string }

export async function submitReport(
  input: SubmitReportInput,
  deps: SubmitReportDeps,
): Promise<SubmitResult> {
  const report = await deps.reportRepo.findById(input.reportId)
  if (!report) throw new NotFoundError('Report not found')
  if (report.tokenId !== input.tokenId) throw new ForbiddenError('Not the author')
  if (report.status !== 'pending') throw new ValidationError('Report is not in pending status')

  const evidence = await deps.evidenceRepo.findByReportId(report.id)
  if (evidence.length === 0) throw new ValidationError('At least one evidence required')

  const textPayload = buildTextPayload(report.title, report.body)
  const textResult = await deps.moderation.classifyText(textPayload)

  if (textResult.flagged) {
    return rejectReport(report.id, input.tokenId, textResult, textPayload, deps)
  }

  const imageResult = await screenImages(evidence, deps)
  if (imageResult) {
    return rejectReport(report.id, input.tokenId, imageResult, 'image-content', deps)
  }

  return { outcome: 'submitted' }
}

async function rejectReport(
  reportId: string,
  tokenId: string,
  result: { categories: string[]; score: number },
  content: string,
  deps: SubmitReportDeps,
): Promise<SubmitResult> {
  await deps.reportRepo.update(reportId, { status: 'rejected' })

  const hash = await computeContentHash(content)
  await deps.forensicLog.logRejection({
    reportId,
    tokenId,
    rejectionReason: result.categories.join(', '),
    aiConfidence: result.score,
    contentHash: hash,
  })

  const reason = result.categories.join(', ')
  return { outcome: 'rejected', reason }
}
