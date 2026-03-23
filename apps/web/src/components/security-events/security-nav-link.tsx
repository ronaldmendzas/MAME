'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { canAccessSecurityEvents, getRoleFromSessionClaims } from '@/lib/auth-role'

export function SecurityNavLink() {
  const { isLoaded, sessionClaims } = useAuth()
  const role = getRoleFromSessionClaims(sessionClaims)

  if (!isLoaded || !canAccessSecurityEvents(role)) return null

  return (
    <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
      <Link href="/security/events">Security Events</Link>
    </Button>
  )
}
