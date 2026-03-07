import type {
  EvidenceType,
  FlagCategory,
  ModerationAction,
  ReportCategory,
  ReportStatus,
  UserRole,
} from '../constants/index.js'

export interface User {
  id: string
  clerkId: string
  emailHash: string
  role: UserRole
  faculty: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AnonymousProfile {
  tokenId: string
  displayName: string
  createdAt: Date
}

export interface Report {
  id: string
  tokenId: string
  title: string
  body: string
  category: ReportCategory
  faculty: string
  status: ReportStatus
  votes: number
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

export interface Evidence {
  id: string
  reportId: string
  type: EvidenceType
  fileKey: string
  mimeType: string | null
  sizeBytes: number | null
  createdAt: Date
}

export interface Comment {
  id: string
  reportId: string
  tokenId: string
  parentId: string | null
  body: string
  createdAt: Date
}

export interface Vote {
  id: string
  reportId: string
  tokenId: string
  createdAt: Date
}

export interface ModerationLogEntry {
  id: string
  reportId: string
  moderatorToken: string
  action: ModerationAction
  reason: string | null
  createdAt: Date
}

export interface StatusHistoryEntry {
  id: string
  reportId: string
  oldStatus: ReportStatus
  newStatus: ReportStatus
  reason: string | null
  createdAt: Date
}

export interface Flag {
  id: string
  reportId: string
  tokenId: string
  category: FlagCategory
  description: string | null
  createdAt: Date
}

export interface Notification {
  id: string
  tokenId: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  createdAt: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
