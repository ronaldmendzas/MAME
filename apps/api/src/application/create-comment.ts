import type { CommentRepository, CommentRow } from '../domain/ports/comment-repository.js'
import type { ReportRepository } from '../domain/ports/report-repository.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'

export interface CreateCommentInput {
  reportId: string
  tokenId: string
  parentId: string | null
  body: string
}

export interface CreateCommentDeps {
  commentRepo: CommentRepository
  reportRepo: ReportRepository
}

const MAX_BODY_LENGTH = 1000
const MAX_NESTING_DEPTH = 2

export async function createComment(
  input: CreateCommentInput,
  deps: CreateCommentDeps,
): Promise<CommentRow> {
  validateBody(input.body)
  await validateReportExists(input.reportId, deps.reportRepo)
  await validateParentNesting(input.parentId, deps.commentRepo)

  return deps.commentRepo.insert(input)
}

function validateBody(body: string) {
  if (body.trim().length === 0) throw new ValidationError('Comment body is required')
  if (body.length > MAX_BODY_LENGTH) {
    throw new ValidationError(`Comment body must not exceed ${MAX_BODY_LENGTH} characters`)
  }
}

async function validateReportExists(reportId: string, repo: ReportRepository) {
  const report = await repo.findById(reportId)
  if (!report) throw new NotFoundError('Report')
  if (report.status !== 'published') {
    throw new ValidationError('Cannot comment on unpublished reports')
  }
}

async function validateParentNesting(
  parentId: string | null,
  repo: CommentRepository,
) {
  if (!parentId) return

  const parent = await repo.findById(parentId)
  if (!parent) throw new NotFoundError('Parent comment')
  if (parent.parentId !== null) {
    throw new ValidationError(`Comments can only be nested ${MAX_NESTING_DEPTH} levels deep`)
  }
}
