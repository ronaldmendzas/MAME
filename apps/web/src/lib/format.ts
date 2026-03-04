import type { ReportCategory, ReportStatus } from '@mame/shared/constants'

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  'sexual-harassment': 'Sexual Harassment',
  'academic-corruption': 'Academic Corruption',
  'faculty-plagiarism': 'Faculty Plagiarism',
  discrimination: 'Discrimination',
  nepotism: 'Nepotism',
  'administrative-irregularities': 'Administrative Irregularities',
  fraud: 'Fraud',
  other: 'Other',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: 'bg-neutral-200 text-neutral-700',
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-neutral-300 text-neutral-600',
  resolved: 'bg-purple-100 text-purple-800',
}

export function getCategoryLabel(cat: ReportCategory): string {
  return CATEGORY_LABELS[cat] ?? cat
}

export function getStatusColor(status: ReportStatus): string {
  return STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-600'
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
