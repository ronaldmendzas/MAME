import { ForbiddenError, NotFoundError, ValidationError } from '../domain/errors.js'
import type { ReportRepository, ReportRow } from '../domain/ports/report-repository.js'

export interface UpdateReportInput {
  reportId: string
  tokenId: string
  title?: string
  body?: string
}

export interface UpdateReportDeps {
  reportRepo: ReportRepository
}

export async function updateReport(
  input: UpdateReportInput,
  deps: UpdateReportDeps,
): Promise<ReportRow> {
  const report = await deps.reportRepo.findById(input.reportId)
  if (!report) throw new NotFoundError('Report')
  if (report.tokenId !== input.tokenId) throw new ForbiddenError()
  if (report.status !== 'draft') {
    throw new ValidationError('Only draft reports can be edited')
  }

  return deps.reportRepo.update(input.reportId, {
    ...(input.title && { title: input.title }),
    ...(input.body && { body: input.body }),
  })
}
