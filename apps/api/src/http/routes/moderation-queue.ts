import type { Context } from 'hono'

import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createReportRepository } from '../../infrastructure/db/report-repository.js'

export async function handleModerationQueue(c: Context<AppEnv>) {
  const db = createDb(c.env.DATABASE_URL)
  const reportRepo = createReportRepository(db)

  const cursor = c.req.query('cursor') ?? null
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 50)

  const reports = await reportRepo.findPublished(cursor, limit, {})

  return c.json({ success: true, data: reports })
}
