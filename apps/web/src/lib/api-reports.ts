import type { CreateReportInput } from '@mame/shared/schemas'
import type { ApiResponse, PaginatedResponse, Report, StatusHistoryEntry } from '@mame/shared/types'

import { API_BASE, apiFetch, encodePathSegment, sanitizeReport } from './api-client'
import type { EvidenceItem, SubmitResult } from './api-types'

export async function fetchFeed(params?: URLSearchParams) {
  const qs = params?.toString() ? `?${params}` : ''
  const res = await apiFetch<PaginatedResponse<Report>>(`/reports${qs}`)
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function fetchReport(id: string, token?: string) {
  const res = await apiFetch<ApiResponse<Report>>(
    `/reports/${encodePathSegment(id)}`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  )
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
  return apiFetch<ApiResponse<StatusHistoryEntry[]>>(
    `/reports/${encodePathSegment(reportId)}/history`,
  )
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
  return apiFetch<ApiResponse<EvidenceItem>>(
    `/reports/${encodePathSegment(reportId)}/evidence/link`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    },
  )
}

export async function submitForReview(reportId: string, token: string) {
  return apiFetch<ApiResponse<SubmitResult>>(`/reports/${encodePathSegment(reportId)}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}
