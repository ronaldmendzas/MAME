'use client'

import { useFeed } from '@/hooks/use-feed'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { ReportCard } from './report-card'
import { SkeletonFeed } from './skeleton-card'

export function ReportFeed({ params }: { params?: URLSearchParams }) {
  const { reports, loading, hasMore, loadMore, error } = useFeed(params)
  const sentinelRef = useIntersectionObserver(loadMore, hasMore && !loading)

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>
  }

  if (!loading && reports.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No reports found. Be the first to report!
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
      {loading && <div className="mt-4"><SkeletonFeed count={3} /></div>}
      <div ref={sentinelRef} className="h-4" />
    </>
  )
}
