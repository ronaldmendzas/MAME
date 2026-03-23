import type { Context } from 'hono'
import { desc, inArray } from 'drizzle-orm'

import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { reports } from '../../infrastructure/db/schema/reports.js'

export async function handleModerationQueue(c: Context<AppEnv>) {
  const db = createDb(c.env.DATABASE_URL)
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 50)

  const queue = await db
    .select()
    .from(reports)
    .where(inArray(reports.status, ['pending', 'under_review']))
    .orderBy(desc(reports.createdAt))
    .limit(limit)

  return c.json({ success: true, data: queue })
}
