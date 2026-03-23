import type { Context, Next } from 'hono'

import { recordSecurityEvent } from '../../application/security-events.js'
import { ForbiddenError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'

type UserRole = 'user' | 'moderator' | 'admin' | 'auditor'

export function requireRole(...roles: UserRole[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const userRole = c.get('userRole') as string | undefined

    if (!userRole || !roles.includes(userRole as UserRole)) {
      void recordSecurityEvent(c.env, {
        eventType: 'access_denied',
        outcome: 'denied',
        source: 'role_middleware',
        target: c.req.path,
        actorToken: c.get('tokenId') || null,
        actorRole: userRole ?? null,
        details: {
          method: c.req.method,
          requiredRoles: roles,
          currentRole: userRole ?? null,
        },
      })
      throw new ForbiddenError(`Requires role: ${roles.join(' or ')}`)
    }

    await next()
  }
}
