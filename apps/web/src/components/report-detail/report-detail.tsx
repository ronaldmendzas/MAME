import type { Report } from '@mame/shared/types'
import { getCategoryLabel, formatDate, getStatusColor } from '@/lib/format'
import { StatusTimeline } from './status-timeline'

export function ReportDetail({ report }: { report: Report }) {
  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
          {getCategoryLabel(report.category)}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(report.status)}`}>
          {report.status.replace('_', ' ')}
        </span>
        <span className="text-xs text-neutral-500">{report.faculty}</span>
      </div>
      <h1 className="mb-2 text-2xl font-bold">{report.title}</h1>
      <p className="mb-6 text-xs text-neutral-500">
        {formatDate(report.publishedAt ?? report.createdAt)} &middot; {report.votes} votes
      </p>
      <StatusTimeline currentStatus={report.status} />
      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {report.body}
      </div>
      <EvidencePlaceholder />
      <CommentsPlaceholder />
    </article>
  )
}

function EvidencePlaceholder() {
  return (
    <section className="mt-8 rounded-lg border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-600">
      <p className="text-sm text-neutral-500">Evidence attachments coming in a future update.</p>
    </section>
  )
}

function CommentsPlaceholder() {
  return (
    <section className="mt-6 rounded-lg border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-600">
      <p className="text-sm text-neutral-500">Comments section coming soon.</p>
    </section>
  )
}
