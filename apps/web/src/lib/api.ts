import type { CreateReportInput } from '@mame/shared/schemas'
import type { ApiResponse, PaginatedResponse, Report, StatusHistoryEntry } from '@mame/shared/types'

import { sanitizeText } from './sanitize'

const API_BASE = resolveApiBase(process.env['NEXT_PUBLIC_API_URL'])

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function sanitizeReport(r: Report): Report {
  return { ...r, title: sanitizeText(r.title), body: sanitizeText(r.body) }
}

function resolveApiBase(rawBase: string | undefined): string {
  const fallback = 'http://localhost:8787'
  const base = rawBase?.trim() || fallback

  let parsed: URL
  try {
    parsed = new URL(base)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_API_URL')
  }

  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  const isSecure = parsed.protocol === 'https:'
  const isDevelopment = process.env['NODE_ENV'] !== 'production'

  if (!isSecure && !(isDevelopment && isLocalhost)) {
    throw new Error('NEXT_PUBLIC_API_URL must use https in production')
  }

  return parsed.origin
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) throw new ApiError(json.error ?? 'Request failed', res.status)
  return json as T
}

export async function fetchFeed(params?: URLSearchParams) {
  const qs = params?.toString() ? `?${params}` : ''
  const res = await apiFetch<PaginatedResponse<Report>>(`/reports${qs}`)
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function fetchReport(id: string, token?: string) {
  const res = await apiFetch<ApiResponse<Report>>(`/reports/${encodePathSegment(id)}`, token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined)
  return res.data ? { ...res, data: sanitizeReport(res.data) } : res
}

export async function fetchMyReports(token: string, params?: URLSearchParams) {
  const qs = params?.toString() ? `?${params}` : ''
  const res = await apiFetch<PaginatedResponse<Report>>(`/reports/mine${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function createReport(data: CreateReportInput, token: string) {
  return apiFetch<ApiResponse<Report>>('/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}

export async function fetchStatusHistory(reportId: string) {
  return apiFetch<ApiResponse<StatusHistoryEntry[]>>(`/reports/${encodePathSegment(reportId)}/history`)
}

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

export async function fetchEvidence(reportId: string) {
  return apiFetch<ApiResponse<EvidenceItem[]>>(`/reports/${encodePathSegment(reportId)}/evidence`)
}

export async function uploadEvidence(reportId: string, file: File, token: string) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/reports/${encodePathSegment(reportId)}/evidence`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json as ApiResponse<EvidenceItem>
}

export async function addExternalLink(reportId: string, url: string, token: string) {
  return apiFetch<ApiResponse<EvidenceItem>>(`/reports/${encodePathSegment(reportId)}/evidence/link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  })
}

export interface SubmitResult {
  outcome: 'submitted' | 'rejected'
  reason?: string
}

export async function submitForReview(reportId: string, token: string) {
  return apiFetch<ApiResponse<SubmitResult>>(`/reports/${encodePathSegment(reportId)}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
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

export async function fetchSecurityEvents(token: string, limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) })
  return apiFetch<SecurityEventsResponse>(`/security/events?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

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

export async function fetchModerationQueue(token: string, limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) })
  const res = await apiFetch<ModerationQueueResponse>(`/moderation/queue?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function moderateReport(reportId: string, payload: ModerateReportPayload, token: string) {
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
