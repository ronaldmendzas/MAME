'use client'

import { useAuth } from '@clerk/nextjs'

import { ModerationQueue } from './moderation-queue'

import { canModerateReports, getRoleFromSessionClaims } from '@/lib/auth-role'

export function ModerationGuard() {
  const { isLoaded, sessionClaims } = useAuth()
  const role = getRoleFromSessionClaims(sessionClaims)

  if (!isLoaded) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Checking access...</p>
  }

  if (!canModerateReports(role)) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Access denied. This section is available only for auditor, moderator and admin roles.
      </p>
    )
  }

  return <ModerationQueue />
}
