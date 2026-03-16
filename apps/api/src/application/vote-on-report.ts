import type { VoteRepository } from '../domain/ports/vote-repository.js'
import type { ReportRepository } from '../domain/ports/report-repository.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'

export interface VoteOnReportInput {
  reportId: string
  tokenId: string
}

export interface VoteOnReportDeps {
  voteRepo: VoteRepository
  reportRepo: ReportRepository
}

export async function voteOnReport(input: VoteOnReportInput, deps: VoteOnReportDeps) {
  const report = await deps.reportRepo.findById(input.reportId)
  if (!report) throw new NotFoundError('Report')
  if (report.status !== 'published') {
    throw new ValidationError('Cannot vote on unpublished reports')
  }

  const existing = await deps.voteRepo.findByReportAndToken(input.reportId, input.tokenId)
  if (existing) throw new ConflictError('Vote')

  return deps.voteRepo.insert(input)
}

export async function removeVote(input: VoteOnReportInput, deps: VoteOnReportDeps) {
  const existing = await deps.voteRepo.findByReportAndToken(input.reportId, input.tokenId)
  if (!existing) throw new NotFoundError('Vote')

  await deps.voteRepo.deleteByReportAndToken(input.reportId, input.tokenId)
}
