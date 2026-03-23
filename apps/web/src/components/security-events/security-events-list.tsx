'use client'

import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSecurityEvents } from '@/hooks/use-security-events'

const LIMITS = [25, 50, 100, 200]
const ALL = 'all'
const EVENT_TYPES = ['auth_success', 'auth_failure', 'access_denied', 'sensitive_endpoint_attempt'] as const
const OUTCOMES = ['allowed', 'denied', 'error'] as const

export function SecurityEventsList() {
  const { events, loading, error, limit, setLimit, refresh } = useSecurityEvents()
  const [eventTypeFilter, setEventTypeFilter] = useState<string>(ALL)
  const [outcomeFilter, setOutcomeFilter] = useState<string>(ALL)
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (eventTypeFilter !== ALL && event.eventType !== eventTypeFilter) return false
      if (outcomeFilter !== ALL && event.outcome !== outcomeFilter) return false
      if (!normalizedQuery) return true

      const searchable = [
        event.eventType,
        event.outcome,
        event.actorRole ?? 'anonymous',
        event.source,
        event.target ?? '',
      ].join(' ').toLowerCase()

      return searchable.includes(normalizedQuery)
    })
  }, [events, eventTypeFilter, outcomeFilter, normalizedQuery])

  const emptyBase = useMemo(() => !loading && !error && events.length === 0, [loading, error, events.length])
  const emptyFiltered = useMemo(
    () => !loading && !error && events.length > 0 && filteredEvents.length === 0,
    [loading, error, events.length, filteredEvents.length],
  )

  function resetFilters() {
    setEventTypeFilter(ALL)
    setOutcomeFilter(ALL)
    setQuery('')
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-4">
        <div>
          <h2 className="text-base font-semibold">Recent Security Events</h2>
          <p className="text-sm text-muted-foreground">Read-only stream from the backend audit log.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid gap-3 rounded-lg border border-border/60 bg-card/40 p-4 md:grid-cols-4">
        <input
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Search source, role, target"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={eventTypeFilter}
          onChange={(event) => setEventTypeFilter(event.target.value)}
        >
          <option value={ALL}>All event types</option>
          {EVENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={outcomeFilter}
          onChange={(event) => setOutcomeFilter(event.target.value)}
        >
          <option value={ALL}>All outcomes</option>
          {OUTCOMES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading security events...</p>}
      {error && <p className="py-8 text-center text-sm text-destructive">{error}</p>}
      {emptyBase && <p className="py-8 text-center text-sm text-muted-foreground">No security events found.</p>}
      {emptyFiltered && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events match current filters. Try different values or clear filters.
        </p>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
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
              {filteredEvents.map((event) => (
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
