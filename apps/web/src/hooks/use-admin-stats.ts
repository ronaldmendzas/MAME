'use client'

import { useEffect, useState } from 'react'

import { fetchAdminStats, type AdminStats } from '@/lib/api'

export function useAdminStats(token: string | null) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchAdminStats(token)
      .then((res) => {
        if (res.success) setStats(res.data)
        else setError('Failed to load stats')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return { stats, loading, error }
}
