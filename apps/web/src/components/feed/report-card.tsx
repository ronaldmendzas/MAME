import Link from 'next/link'
import type { Report } from '@mame/shared/types'
import { getCategoryLabel, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link href={`/reports/${report.id}`} className="block">
      <Card className="gap-3 p-4 transition-colors hover:border-ring">
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{getCategoryLabel(report.category)}</Badge>
            <span className="text-xs text-muted-foreground">{report.faculty}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug">{report.title}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">{report.body}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(report.publishedAt ?? report.createdAt)}</span>
            <span>{report.votes} votes</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
