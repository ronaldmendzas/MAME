'use client'

import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSecurityEvents } from '@/hooks/use-security-events'

const LIMITS = [25, 50, 100, 200]

export function SecurityEventsList() {
  const { events, loading, error, limit, setLimit, refresh } = useSecurityEvents()

  const empty = useMemo(() => !loading && !error && events.length === 0, [loading, error, events.length])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-4">
        <div>
          <h2 className="text-base font-semibold">Recent Security Events</h2>
          <p className="text-sm text-muted-foreground">Read-only stream from the backend audit log.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="security-events-limit">Limit</label>
          <select
            id="security-events-limit"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            {LIMITS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading security events...</p>}
      {error && <p className="py-8 text-center text-sm text-destructive">{error}</p>}
      {empty && <p className="py-8 text-center text-sm text-muted-foreground">No security events found.</p>}

      {!loading && !error && events.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-border/60">
                  <td className="px-4 py-3 align-top text-muted-foreground">{formatDate(event.createdAt)}</td>
                  <td className="px-4 py-3 align-top">{event.eventType}</td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={event.outcome === 'allowed' ? 'default' : 'destructive'}>{event.outcome}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{event.actorRole ?? 'anonymous'}</td>
                  <td className="max-w-[340px] truncate px-4 py-3 align-top text-muted-foreground">{event.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
