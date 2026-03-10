import type { ModerationResult } from '../domain/ports/moderation-port.js'

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/')
}

export function buildTextPayload(title: string, body: string): string {
  return `${title}\n\n${body}`
}

export function hasRejection(results: ModerationResult[]): boolean {
  return results.some((r) => r.flagged)
}

export function firstFlagged(results: ModerationResult[]): ModerationResult | undefined {
  return results.find((r) => r.flagged)
}
