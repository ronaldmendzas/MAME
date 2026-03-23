import type { Context, Next } from 'hono'

import { ForbiddenError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'

type UserRole = 'user' | 'moderator' | 'admin' | 'auditor'

export function requireRole(...roles: UserRole[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const userRole = c.get('userRole') as string | undefined

    if (!userRole || !roles.includes(userRole as UserRole)) {
      throw new ForbiddenError(`Requires role: ${roles.join(' or ')}`)
    }

    await next()
  }
}
