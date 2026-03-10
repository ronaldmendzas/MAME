import type { Context } from 'hono'
import { z } from 'zod'

import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createStatusHistoryRepository } from '../../infrastructure/db/status-history-repository.js'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function handleStatusHistory(c: Context<AppEnv>) {
  const parsed = paramsSchema.safeParse({ id: c.req.param('id') })
  if (!parsed.success) {
    throw new ValidationError('Invalid report ID')
  }

  const db = createDb(c.env.DATABASE_URL)
  const historyRepo = createStatusHistoryRepository(db)
  const entries = await historyRepo.findByReportId(parsed.data.id)

  const data = entries.map(({ changedByToken: _, ...rest }) => rest)

  return c.json({ success: true, data })
}
