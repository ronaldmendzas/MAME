import type { ReportRepository, ReportRow } from '../domain/ports/report-repository.js'
import type { ReportCategory } from '../domain/types.js'

export interface CreateReportInput {
  tokenId: string
  title: string
  body: string
  category: ReportCategory
  faculty: string
}

export interface CreateReportDeps {
  reportRepo: ReportRepository
}

export async function createReport(
  input: CreateReportInput,
  deps: CreateReportDeps,
): Promise<ReportRow> {
  return deps.reportRepo.insert({ ...input, status: 'pending' })
}
