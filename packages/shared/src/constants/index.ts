export const REPORT_CATEGORIES = [
  'sexual-harassment',
  'academic-corruption',
  'faculty-plagiarism',
  'discrimination',
  'nepotism',
  'administrative-irregularities',
  'fraud',
  'other',
] as const

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const REPORT_STATUSES = [
  'draft',
  'pending',
  'under_review',
  'published',
  'rejected',
  'archived',
  'resolved',
] as const

export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const USER_ROLES = ['user', 'moderator', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const EVIDENCE_TYPES = ['file', 'external_link'] as const

export type EvidenceType = (typeof EVIDENCE_TYPES)[number]

export const MODERATION_ACTIONS = ['approve', 'reject', 'request_info', 'escalate'] as const

export type ModerationAction = (typeof MODERATION_ACTIONS)[number]

export const FLAG_CATEGORIES = [
  'false_report',
  'inappropriate',
  'exposed_data',
  'harassment',
  'other',
] as const

export type FlagCategory = (typeof FLAG_CATEGORIES)[number]

export const MAX_TITLE_LENGTH = 200
export const MIN_TITLE_LENGTH = 10
export const MAX_BODY_LENGTH = 5000
export const MIN_BODY_LENGTH = 100
export const MAX_COMMENT_LENGTH = 1000
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_COMPRESSED_BYTES = 200 * 1024
export const MAX_REPORTS_PER_DAY = 10
export const FLAG_THRESHOLD = 5
export const PUBLICATION_DELAY_MIN_SECONDS = 3600
export const PUBLICATION_DELAY_MAX_SECONDS = 21600
