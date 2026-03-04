'use client'

import { useMyReports } from '@/hooks/use-my-reports'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { SkeletonFeed } from '@/components/feed'
import { MyReportCard } from './my-report-card'

export function MyReportsList() {
  const { reports, loading, hasMore, loadMore, error } = useMyReports()
  const sentinelRef = useIntersectionObserver(loadMore, hasMore && !loading)

  if (error) return <p className="py-20 text-center text-destructive">{error}</p>
  if (!loading && reports.length === 0) return <EmptyState />

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => <MyReportCard key={r.id} report={r} />)}
      </div>
      {loading && <SkeletonFeed />}
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">You have not submitted any reports yet.</p>
    </div>
  )
}
