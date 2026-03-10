'use client'

import type { StatusHistoryEntry } from '@mame/shared/types'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { fetchStatusHistory } from '@/lib/api'
import { formatDate, getStatusColor } from '@/lib/format'

interface StatusTimelineProps {
  reportId: string
}

export function StatusTimeline({ reportId }: StatusTimelineProps) {
  const [entries, setEntries] = useState<StatusHistoryEntry[]>([])

  useEffect(() => {
    fetchStatusHistory(reportId)
      .then((res) => setEntries(res.data ?? []))
      .catch(() => setEntries([]))
  }, [reportId])

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">No status changes yet.</p>
  }

  return (
    <ol className="relative border-l border-border pl-4">
      {entries.map((entry) => (
        <TimelineItem key={entry.id} entry={entry} />
      ))}
    </ol>
  )
}

function TimelineItem({ entry }: { entry: StatusHistoryEntry }) {
  return (
    <li className="mb-4 last:mb-0">
      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-background" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={getStatusColor(entry.oldStatus)}>
          {entry.oldStatus.replace('_', ' ')}
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge className={getStatusColor(entry.newStatus)}>
          {entry.newStatus.replace('_', ' ')}
        </Badge>
        <time className="text-xs text-muted-foreground">
          {formatDate(entry.createdAt)}
        </time>
      </div>
      {entry.reason && (
        <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p>
      )}
    </li>
  )
}
