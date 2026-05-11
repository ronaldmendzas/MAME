import type { SecurityEvent } from './api'
import { filterSecurityEvents } from './security-events-filter'

const EVENTS: SecurityEvent[] = [
  {
    id: '1',
    eventType: 'auth_success',
    outcome: 'allowed',
    actorToken: null,
    actorRole: 'auditor',
    source: 'auth_middleware',
    target: '/security/events',
    details: {},
    createdAt: '2026-03-22T10:00:00.000Z',
  },
  {
    id: '2',
    eventType: 'access_denied',
    outcome: 'denied',
    actorToken: 'token-1',
    actorRole: 'user',
    source: 'role_middleware',
    target: '/admin/reports',
    details: {},
    createdAt: '2026-03-22T10:01:00.000Z',
  },
]

describe('filterSecurityEvents', () => {
  it('returns all events when filters are all + empty query', () => {
    const result = filterSecurityEvents(EVENTS, {
      eventType: 'all',
      outcome: 'all',
      query: '',
    })

    expect(result).toHaveLength(2)
  })

  it('filters by event type', () => {
    const result = filterSecurityEvents(EVENTS, {
      eventType: 'access_denied',
      outcome: 'all',
      query: '',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })

  it('filters by outcome', () => {
    const result = filterSecurityEvents(EVENTS, {
      eventType: 'all',
      outcome: 'allowed',
      query: '',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('filters by free-text query across searchable fields', () => {
    const result = filterSecurityEvents(EVENTS, {
      eventType: 'all',
      outcome: 'all',
      query: 'admin/reports',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })
})
