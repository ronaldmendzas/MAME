import type { Context } from 'hono'

import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createSecurityEventRepository } from '../../infrastructure/db/security-event-repository.js'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export async function handleSecurityEvents(c: Context<AppEnv>) {
  const db = createDb(c.env.DATABASE_URL)
  const repo = createSecurityEventRepository(db)

  const limit = parseLimit(c.req.query('limit'))
  const events = await repo.findRecent(limit)

  return c.json({
    success: true,
    data: events,
    meta: { limit, count: events.length },
  })
}

function parseLimit(raw: string | undefined): number {
  const parsed = Number(raw ?? DEFAULT_LIMIT)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
}
