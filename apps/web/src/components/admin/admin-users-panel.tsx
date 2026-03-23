'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAdminUsers } from '@/hooks/use-admin-users'
import type { AdminUser } from '@/lib/api'

const ROLE_OPTIONS: AdminUser['role'][] = ['user', 'moderator', 'auditor', 'admin']

export function AdminUsersPanel() {
  const { users, loading, acting, error, updateRole, refresh } = useAdminUsers()
  const [draftRoles, setDraftRoles] = useState<Record<string, AdminUser['role']>>({})

  const viewModels = useMemo(() => {
    return users.map((user) => ({
      ...user,
      draftRole: draftRoles[user.id] ?? user.role,
    }))
  }, [draftRoles, users])

  const handleSave = async (userId: string) => {
    const selectedRole = draftRoles[userId]
    const current = users.find((u) => u.id === userId)
    if (!current || !selectedRole || selectedRole === current.role) return
    await updateRole(userId, selectedRole)
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">User Role Management</h2>
          <p className="text-sm text-muted-foreground">Admin can assign user, moderator, auditor or admin roles.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading || acting}>
          Refresh
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading users...</p>
      ) : (
        <div className="space-y-3">
          {viewModels.map((user) => (
            <div key={user.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="text-sm font-medium">{user.id}</p>
                <p className="text-xs text-muted-foreground">Clerk: {user.clerkId}</p>
              </div>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={user.draftRole}
                aria-label={`Role for user ${user.id}`}
                disabled={acting}
                onChange={(event) => {
                  const next = event.target.value as AdminUser['role']
                  setDraftRoles((prev) => ({ ...prev, [user.id]: next }))
                }}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={acting || user.draftRole === user.role}
                onClick={() => void handleSave(user.id)}
              >
                Save Role
              </Button>
            </div>
          ))}
          {viewModels.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          )}
        </div>
      )}
    </section>
  )
}