import type { CreateReportInput } from '@mame/shared/schemas'
import type { ApiResponse, PaginatedResponse, Report } from '@mame/shared/types'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787'

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
  return apiFetch<PaginatedResponse<Report>>(`/reports${qs}`)
}

export async function fetchReport(id: string) {
  return apiFetch<ApiResponse<Report>>(`/reports/${id}`)
}

export async function fetchMyReports(token: string, params?: URLSearchParams) {
  const qs = params?.toString() ? `?${params}` : ''
  return apiFetch<PaginatedResponse<Report>>(`/reports/mine${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createReport(data: CreateReportInput, token: string) {
  return apiFetch<ApiResponse<Report>>('/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
}
