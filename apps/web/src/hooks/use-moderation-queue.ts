'use client'

import { useAuth } from '@clerk/nextjs'
import type { Report } from '@mame/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, fetchModerationQueue, moderateReport, type ModerateReportPayload } from '@/lib/api'

interface UseModerationQueueResult {
  reports: Report[]
  loading: boolean
  acting: boolean
  error: string | null
  refresh: () => Promise<void>
  applyAction: (reportId: string, payload: ModerateReportPayload) => Promise<void>
}

export function useModerationQueue(): UseModerationQueueResult {
  const { getToken } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetching = useRef(false)

  const refresh = useCallback(async () => {
    if (fetching.current) return
    fetching.current = true
    setLoading(true)
    setError(null)

    try {
      const token = await getToken({ template: 'mame-api' })
      if (!token) throw new Error('Not authenticated')
      const res = await fetchModerationQueue(token)
      setReports(res.data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError('Access denied. You need auditor, moderator or admin role to moderate reports.')
      } else if (e instanceof ApiError && e.status === 401) {
        setError('Your session is not authorized. Please sign out and sign in again.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load moderation queue')
      }
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }, [getToken])

  const applyAction = useCallback(async (reportId: string, payload: ModerateReportPayload) => {
    setActing(true)
    setError(null)
    try {
      const token = await getToken({ template: 'mame-api' })
      if (!token) throw new Error('Not authenticated')
      await moderateReport(reportId, payload, token)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply moderation action')
      throw e
    } finally {
      setActing(false)
    }
  }, [getToken, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { reports, loading, acting, error, refresh, applyAction }
}
