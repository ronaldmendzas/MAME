import { ValidationError } from './errors.js'
import type { ReportStatus } from './types.js'


const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ['pending'],
  pending: ['under_review', 'rejected'],
  under_review: ['published', 'rejected'],
  published: ['archived'],
  rejected: ['pending'],
  archived: ['published'],
  resolved: [],
}

export function validateTransition(from: ReportStatus, to: ReportStatus): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed?.includes(to)) {
    throw new ValidationError(`Invalid transition: ${from} → ${to}`)
  }
}

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
