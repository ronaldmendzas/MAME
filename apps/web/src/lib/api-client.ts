import type { Report } from '@mame/shared/types'

import { sanitizeText } from './sanitize'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function sanitizeReport(r: Report): Report {
  return { ...r, title: sanitizeText(r.title), body: sanitizeText(r.body) }
}

export const API_BASE = resolveApiBase(process.env['NEXT_PUBLIC_API_URL'])

function resolveApiBase(rawBase: string | undefined): string {
  const fallback = 'http://localhost:8787'
  const base = rawBase?.trim() || fallback

  let parsed: URL
  try {
    parsed = new URL(base)
  } catch {
    return fallback
  }

  return parsed.origin
}

export function encodePathSegment(value: string): string {
  return encodeURIComponent(value)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) throw new ApiError(json.error ?? 'Request failed', res.status)
  return json as T
}
