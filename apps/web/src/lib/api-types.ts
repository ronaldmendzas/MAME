export interface EvidenceItem {
  id: string
  reportId: string
  type: string
  fileKey: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

export interface SubmitResult {
  outcome: 'submitted' | 'rejected'
  reason?: string
}

export interface SecurityEvent {
  id: string
  eventType: 'auth_success' | 'auth_failure' | 'access_denied' | 'sensitive_endpoint_attempt'
  outcome: 'allowed' | 'denied' | 'error'
  actorToken: string | null
  actorRole: string | null
  source: string
  target: string | null
  details: Record<string, unknown>
  createdAt: string
}

export interface SecurityEventsResponse {
  success: boolean
  data: SecurityEvent[]
  meta: {
    limit: number
    count: number
  }
}

import type { Report } from '@mame/shared/types'

export interface ModerationQueueResponse {
  success: boolean
  data: Report[]
}

export interface ModerateReportPayload {
  action: 'approve' | 'reject' | 'request_info' | 'escalate'
  reason?: string | null
  moderatorFaculty: string
}

export interface AdminUser {
  id: string
  clerkId: string
  emailHash: string
  role: 'user' | 'moderator' | 'admin' | 'auditor'
  createdAt: string
}

export interface AdminUsersResponse {
  success: boolean
  data: AdminUser[]
  meta: {
    limit: number
    count: number
  }
}

export interface AdminStats {
  reportsByCategory: { category: string; count: number }[]
  reportsByMonth: { month: string; count: number }[]
  reportsByFaculty: { faculty: string; count: number }[]
  reportsByStatus: { status: string; count: number }[]
  averageModerationTimeMinutes: number | null
  totalReports: number
  totalVotes: number
  totalComments: number
  activeTokens: number
  suspendedTokens: number
}

export interface AdminStatsResponse {
  success: boolean
  data: AdminStats
}
