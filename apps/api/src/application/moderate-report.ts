import { ForbiddenError, NotFoundError, ValidationError } from '../domain/errors.js'
import type {
  ModerationAction,
  ModerationLogRepository,
} from '../domain/ports/moderation-log-repository.js'
import type { ReportRepository, ReportRow } from '../domain/ports/report-repository.js'
import type { StatusHistoryRepository } from '../domain/ports/status-history-repository.js'
import type { ReportStatus } from '../domain/types.js'

export interface ModerateReportInput {
  reportId: string
  moderatorToken: string
  moderatorFaculty: string
  action: ModerationAction
  reason: string | null
}

export interface ModerateReportDeps {
  reportRepo: ReportRepository
  moderationLogRepo: ModerationLogRepository
  statusHistoryRepo: StatusHistoryRepository
}

const ACTION_STATUS_MAP: Record<string, ReportStatus> = {
  approve: 'published',
  reject: 'rejected',
  request_info: 'under_review',
  escalate: 'under_review',
}

export async function moderateReport(
  input: ModerateReportInput,
  deps: ModerateReportDeps,
): Promise<ReportRow> {
  const report = await getReport(input.reportId, deps.reportRepo)
  assertNoFacultyConflict(input.moderatorFaculty, report.faculty)
  validateAction(input)

  const newStatus = ACTION_STATUS_MAP[input.action]
  if (!newStatus) throw new ValidationError('Invalid moderation action')

  await logModerationAction(input, deps.moderationLogRepo)
  await logStatusChange(report, newStatus, input, deps.statusHistoryRepo)

  return deps.reportRepo.update(input.reportId, {
    status: newStatus,
    publishedAt: newStatus === 'published' ? new Date() : null,
  })
}

async function getReport(id: string, repo: ReportRepository) {
  const report = await repo.findById(id)
  if (!report) throw new NotFoundError('Report')
  return report
}

function assertNoFacultyConflict(moderatorFaculty: string, reportFaculty: string) {
  const isSameFaculty = moderatorFaculty.toLowerCase() === reportFaculty.toLowerCase()
  if (isSameFaculty) {
    throw new ForbiddenError('Moderators cannot moderate reports from their own faculty')
  }
}

function validateAction(input: ModerateReportInput) {
  const isRejection = input.action === 'reject'
  if (isRejection && !input.reason?.trim()) {
    throw new ValidationError('Reason is mandatory for rejection')
  }
}

async function logModerationAction(input: ModerateReportInput, repo: ModerationLogRepository) {
  await repo.insert({
    reportId: input.reportId,
    moderatorToken: input.moderatorToken,
    action: input.action,
    reason: input.reason,
  })
}

// eslint-disable-next-line max-params
async function logStatusChange(
  report: ReportRow,
  newStatus: ReportStatus,
  input: ModerateReportInput,
  repo: StatusHistoryRepository,
) {
  await repo.insert({
    reportId: report.id,
    oldStatus: report.status,
    newStatus,
    changedByToken: input.moderatorToken,
    ...(input.reason ? { reason: input.reason } : {}),
  })
}
