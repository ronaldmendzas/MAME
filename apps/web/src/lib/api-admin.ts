import type { ApiResponse, Report } from '@mame/shared/types'

import { apiFetch, encodePathSegment, sanitizeReport } from './api-client'
import type {
  AdminStats,
  AdminStatsResponse,
  AdminUser,
  AdminUsersResponse,
  ModerateReportPayload,
  ModerationQueueResponse,
  SecurityEvent,
  SecurityEventsResponse,
} from './api-types'

export async function fetchSecurityEvents(token: string, limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) })
  return apiFetch<SecurityEventsResponse>(`/security/events?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchModerationQueue(token: string, limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) })
  const res = await apiFetch<ModerationQueueResponse>(`/moderation/queue?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function moderateReport(
  reportId: string,
  payload: ModerateReportPayload,
  token: string,
) {
  return apiFetch<ApiResponse<Report>>(`/moderation/${encodePathSegment(reportId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminUsers(token: string, limit = 100) {
  const qs = new URLSearchParams({ limit: String(limit) })
  return apiFetch<AdminUsersResponse>(`/admin/users?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateAdminUserRole(
  token: string,
  userId: string,
  role: 'user' | 'moderator' | 'admin' | 'auditor',
) {
  return apiFetch<ApiResponse<AdminUser>>(`/admin/users/${encodePathSegment(userId)}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  })
}

export async function fetchAdminStats(token: string) {
  return apiFetch<AdminStatsResponse>('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export type { AdminStats, AdminUser, SecurityEvent }
