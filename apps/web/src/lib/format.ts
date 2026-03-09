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
  draft: 'bg-neutral-800/60 text-neutral-300 border border-neutral-700/50',
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  published: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
  archived: 'bg-neutral-700/40 text-neutral-400 border border-neutral-600/40',
  resolved: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
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
