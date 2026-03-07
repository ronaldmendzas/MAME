import type { Report } from '@mame/shared/types'

import { EvidenceSection } from './evidence-section'
import { StatusTimeline } from './status-timeline'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getCategoryLabel, formatDate, getStatusColor } from '@/lib/format'


export function ReportDetail({ report }: { report: Report }) {
  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{getCategoryLabel(report.category)}</Badge>
        <Badge className={getStatusColor(report.status)}>
          {report.status.replace('_', ' ')}
        </Badge>
        <span className="text-xs text-muted-foreground">{report.faculty}</span>
      </div>
      <h1 className="mb-2 text-2xl font-bold">{report.title}</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        {formatDate(report.publishedAt ?? report.createdAt)} &middot; {report.votes} votes
      </p>
      <StatusTimeline reportId={report.id} />
      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {report.body}
      </div>
      <EvidenceSection reportId={report.id} />
      <CommentsPlaceholder />
    </article>
  )
}

function CommentsPlaceholder() {
  return (
    <Card className="mt-6 border-dashed">
      <CardContent className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Comments section coming soon.</p>
      </CardContent>
    </Card>
  )
}
