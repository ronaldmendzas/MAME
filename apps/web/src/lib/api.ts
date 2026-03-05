import type { CreateReportInput } from '@mame/shared/schemas'
import type { ApiResponse, PaginatedResponse, Report } from '@mame/shared/types'

import { sanitizeText } from './sanitize'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787'

function sanitizeReport(r: Report): Report {
  return { ...r, title: sanitizeText(r.title), body: sanitizeText(r.body) }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as T
}

export async function fetchFeed(params?: URLSearchParams) {
  const qs = params?.toString() ? `?${params}` : ''
  const res = await apiFetch<PaginatedResponse<Report>>(`/reports${qs}`)
  return { ...res, data: res.data.map(sanitizeReport) }
}

export async function fetchReport(id: string) {
  const res = await apiFetch<ApiResponse<Report>>(`/reports/${id}`)
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
