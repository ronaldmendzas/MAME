'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

import { ApiError, fetchSecurityEvents, type SecurityEvent } from '@/lib/api'

interface UseSecurityEventsResult {
  events: SecurityEvent[]
  loading: boolean
  error: string | null
  limit: number
  setLimit: (value: number) => void
  refresh: () => Promise<void>
}

const DEFAULT_LIMIT = 50

export function useSecurityEvents(): UseSecurityEventsResult {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetchSecurityEvents(token, limit)
      setEvents(response.data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Session expired. Please sign in again.')
      } else if (e instanceof ApiError && e.status === 403) {
        setError('Access denied. You need auditor or admin role to view security events.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load security events')
      }
    } finally {
      setLoading(false)
    }
  }, [getToken, limit])

  useEffect(() => {
    void load()
  }, [load])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  return { events, loading, error, limit, setLimit, refresh }
}
