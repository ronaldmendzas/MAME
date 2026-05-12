import { pgEnum } from 'drizzle-orm/pg-core'

export const reportCategoryEnum = pgEnum('report_category', [
  'sexual-harassment',
  'academic-corruption',
  'faculty-plagiarism',
  'discrimination',
  'nepotism',
  'administrative-irregularities',
  'fraud',
  'other',
])

export const reportStatusEnum = pgEnum('report_status', [
  'draft',
  'pending',
  'under_review',
  'published',
  'rejected',
  'archived',
  'resolved',
])

export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin', 'auditor'])

export const evidenceTypeEnum = pgEnum('evidence_type', ['file', 'external_link'])

export const moderationActionEnum = pgEnum('moderation_action', [
  'approve',
  'reject',
  'request_info',
  'escalate',
  'edit',
])

export const flagCategoryEnum = pgEnum('flag_category', [
  'false_report',
  'inappropriate',
  'exposed_data',
  'harassment',
  'other',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'status_change',
  'new_comment',
  'new_evidence',
  'moderator_response',
  'flag_threshold',
])

export const securityEventTypeEnum = pgEnum('security_event_type', [
  'auth_success',
  'auth_failure',
  'access_denied',
  'sensitive_endpoint_attempt',
])

export const securityEventOutcomeEnum = pgEnum('security_event_outcome', [
  'allowed',
  'denied',
  'error',
])
