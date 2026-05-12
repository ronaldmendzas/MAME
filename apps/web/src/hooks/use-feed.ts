'use client'

import type { Report } from '@mame/shared/types'
import { useEffect, useRef, useState, useCallback } from 'react'

import { fetchFeed } from '@/lib/api'

interface UseFeedReturn {
  reports: Report[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  error: string | null
}

export function useFeed(params?: URLSearchParams): UseFeedReturn {
  const [reports, setReports] = useState<Report[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetching = useRef(false)

  const load = useCallback(
    async (nextCursor: string | null) => {
      if (fetching.current) return
      fetching.current = true
      setLoading(true)
      try {
        const qs = new URLSearchParams(params?.toString() ?? '')
        if (nextCursor) qs.set('cursor', nextCursor)
        const res = await fetchFeed(qs)
        setReports((prev) => (nextCursor ? [...prev, ...res.data] : res.data))
        setCursor(res.nextCursor)
        setHasMore(res.hasMore)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
        fetching.current = false
      }
    },
    [params],
  )

  useEffect(() => {
    load(null)
  }, [load])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) load(cursor)
  }, [hasMore, loading, cursor, load])

  return { reports, loading, hasMore, loadMore, error }
}
