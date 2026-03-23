'use client'

import type { ModerationAction } from '@mame/shared/constants'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useModerationQueue } from '@/hooks/use-moderation-queue'
import { formatDate } from '@/lib/format'

const ACTIONS: ModerationAction[] = ['approve', 'reject', 'request_info', 'escalate']

function statusClass(status: string): string {
  if (status === 'pending') return 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
  if (status === 'under_review') return 'border-blue-500/40 text-blue-400 bg-blue-500/10'
  if (status === 'published') return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  if (status === 'rejected') return 'border-red-500/40 text-red-400 bg-red-500/10'
  return 'border-border text-muted-foreground'
}

export function ModerationQueue() {
  const { reports, loading, acting, error, refresh, applyAction } = useModerationQueue()
  const [moderatorFaculty, setModeratorFaculty] = useState('')
  const [actions, setActions] = useState<Record<string, ModerationAction>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [localError, setLocalError] = useState<string | null>(null)

  const visible = useMemo(() => reports.filter((r) => r.status === 'pending' || r.status === 'under_review'), [reports])

  async function onApply(reportId: string) {
    setLocalError(null)
    const action = actions[reportId] ?? 'approve'
    const reason = reasons[reportId]?.trim() || null

    if (!moderatorFaculty.trim()) {
      setLocalError('Moderator faculty is required.')
      return
    }

    if (action === 'reject' && !reason) {
      setLocalError('Reason is required for reject.')
      return
    }

    try {
      await applyAction(reportId, {
        action,
        reason,
        moderatorFaculty: moderatorFaculty.trim(),
      })
    } catch {
      // Hook already sets user-facing error.
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading moderation queue...</p>
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <label className="mb-2 block text-sm font-medium text-muted-foreground" htmlFor="moderator-faculty">
          Your faculty (required)
        </label>
        <Input
          id="moderator-faculty"
          value={moderatorFaculty}
          onChange={(e) => setModeratorFaculty(e.target.value)}
          placeholder="Example: Engineering"
          className="max-w-sm"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Policy check: you cannot moderate reports from your own faculty.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Pending Reports</h2>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={acting}>
          Refresh
        </Button>
      </div>

      {(error || localError) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {localError ?? error}
        </p>
      )}

      {visible.length === 0 && (
        <p className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
          No pending reports in the moderation queue.
        </p>
      )}

      <div className="space-y-3">
        {visible.map((report) => {
          const action = actions[report.id] ?? 'approve'
          return (
            <article key={report.id} className="rounded-lg border border-border/60 bg-card/30 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusClass(report.status)}>
                  {report.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                <span className="text-xs text-muted-foreground">{report.faculty}</span>
              </div>

              <h3 className="text-base font-semibold text-foreground">{report.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{report.body}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-start">
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted-foreground">Action</span>
                  <select
                    value={action}
                    onChange={(e) => {
                      const next = e.target.value as ModerationAction
                      setActions((prev) => ({ ...prev, [report.id]: next }))
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {ACTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted-foreground">Reason (required for reject)</span>
                  <Textarea
                    value={reasons[report.id] ?? ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder="Optional note for request_info/escalate; mandatory for reject"
                    className="min-h-20"
                  />
                </label>

                <Button
                  onClick={() => void onApply(report.id)}
                  disabled={acting}
                  className="sm:mt-6"
                >
                  Apply
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
