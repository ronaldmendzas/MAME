import type { SecurityEvent } from './api'

export interface SecurityEventsFilter {
  eventType: string
  outcome: string
  query: string
}

const ALL = 'all'

export function filterSecurityEvents(
  events: SecurityEvent[],
  filters: SecurityEventsFilter,
): SecurityEvent[] {
  const normalizedQuery = filters.query.trim().toLowerCase()

  return events.filter((event) => {
    if (filters.eventType !== ALL && event.eventType !== filters.eventType) return false
    if (filters.outcome !== ALL && event.outcome !== filters.outcome) return false
    if (!normalizedQuery) return true

    const searchable = [
      event.eventType,
      event.outcome,
      event.actorRole ?? 'anonymous',
      event.source,
      event.target ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return searchable.includes(normalizedQuery)
  })
}
