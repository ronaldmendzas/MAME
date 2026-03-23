import { Hono } from 'hono'
import { z } from 'zod'

import { recordSecurityEvent } from '../../application/security-events.js'
import { NotFoundError, ValidationError } from '../../domain/errors.js'
import type { UserRole } from '../../domain/ports/user-repository.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createUserRepository } from '../../infrastructure/db/user-repository.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/role.js'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

const updateRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin', 'auditor']),
})

const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', authMiddleware, requireRole('admin'))

adminRoutes.get('/users', async (c) => {
  const limit = parseLimit(c.req.query('limit'))
  const db = createDb(c.env.DATABASE_URL)
  const repo = createUserRepository(db)
  const users = await repo.listUsers(limit)

  return c.json({
    success: true,
    data: users,
    meta: { limit, count: users.length },
  })
})

adminRoutes.patch('/users/:id/role', async (c) => {
  const parsed = updateRoleSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid role payload')
  }

  const userId = c.req.param('id')
  const nextRole = parsed.data.role as UserRole

  const db = createDb(c.env.DATABASE_URL)
  const repo = createUserRepository(db)
  const updated = await repo.updateRole(userId, nextRole)
  if (!updated) throw new NotFoundError('User')

  void recordSecurityEvent(c.env, {
    eventType: 'sensitive_endpoint_attempt',
    outcome: 'allowed',
    source: 'admin_role_route',
    target: c.req.path,
    actorToken: c.get('tokenId') || null,
    actorRole: c.get('userRole') || null,
    details: {
      action: 'role_update',
      targetUserId: userId,
      newRole: nextRole,
    },
  })

  return c.json({ success: true, data: updated })
})

function parseLimit(raw: string | undefined): number {
  const parsed = Number(raw ?? DEFAULT_LIMIT)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
}

export { adminRoutes }