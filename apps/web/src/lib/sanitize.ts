import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty)
}
