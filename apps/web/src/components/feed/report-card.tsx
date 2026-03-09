import type { Report } from '@mame/shared/types'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getCategoryLabel, formatDate } from '@/lib/format'

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link href={`/reports/${report.id}`} className="group block">
      <Card className="gap-3 border-border/40 bg-card/50 p-5 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border border-border/30 bg-secondary/60 text-xs">
              {getCategoryLabel(report.category)}
            </Badge>
            <span className="text-xs text-muted-foreground/70">{report.faculty}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {report.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{report.body}</p>
          <div className="flex items-center justify-between border-t border-border/20 pt-3 text-xs text-muted-foreground/70">
            <span>{formatDate(report.publishedAt ?? report.createdAt)}</span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              {report.votes}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
