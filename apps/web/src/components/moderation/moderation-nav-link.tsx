'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { canModerateReports, getRoleFromSessionClaims } from '@/lib/auth-role'

export function ModerationNavLink() {
  const { isLoaded, sessionClaims } = useAuth()
  const role = getRoleFromSessionClaims(sessionClaims)

  if (!isLoaded || !canModerateReports(role)) return null

  return (
    <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
      <Link href="/moderation">Moderation</Link>
    </Button>
  )
}
