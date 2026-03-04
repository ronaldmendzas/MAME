import Link from 'next/link'
import type { Report } from '@mame/shared/types'
import { getCategoryLabel, formatDate, getStatusColor } from '@/lib/format'

export function MyReportCard({ report }: { report: Report }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(report.status)}`}>
          {report.status.replace('_', ' ')}
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
          {getCategoryLabel(report.category)}
        </span>
      </div>
      <h3 className="mb-1 text-sm font-semibold leading-snug">{report.title}</h3>
      <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
        {report.body}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <span>{formatDate(report.createdAt)}</span>
        <span>{report.votes} votes</span>
      </div>
    </Link>
  )
}
