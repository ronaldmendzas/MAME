'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

import { ApiError, fetchAdminUsers, updateAdminUserRole, type AdminUser } from '@/lib/api'

interface UseAdminUsersResult {
  users: AdminUser[]
  loading: boolean
  acting: boolean
  error: string | null
  refresh: () => Promise<void>
  updateRole: (userId: string, role: AdminUser['role']) => Promise<void>
}

export function useAdminUsers(): UseAdminUsersResult {
  const { getToken } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken({ template: 'mame-api' })
      if (!token) throw new Error('Not authenticated')
      const res = await fetchAdminUsers(token)
      setUsers(res.data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError('Access denied. You need admin role to manage users.')
      } else if (e instanceof ApiError && e.status === 401) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load admin users')
      }
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const updateRole = useCallback(async (userId: string, role: AdminUser['role']) => {
    setActing(true)
    setError(null)

    try {
      const token = await getToken({ template: 'mame-api' })
      if (!token) throw new Error('Not authenticated')
      await updateAdminUserRole(token, userId, role)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user role')
      throw e
    } finally {
      setActing(false)
    }
  }, [getToken, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { users, loading, acting, error, refresh, updateRole }
}