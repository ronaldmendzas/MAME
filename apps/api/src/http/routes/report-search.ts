import type { Context } from 'hono'
import { z } from 'zod'

import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createSearchRepository } from '../../infrastructure/db/search-repository.js'

const searchSchema = z.object({
  q: z.string().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function handleSearch(c: Context<AppEnv>) {
  const parsed = searchSchema.safeParse(c.req.query())
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid search params')
  }

  const db = createDb(c.env.DATABASE_URL)
  const searchRepo = createSearchRepository(db)
  const results = await searchRepo.search(parsed.data.q, parsed.data.limit, parsed.data.offset)

  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  return c.json({
    success: true,
    data: results,
    meta: { query: parsed.data.q, count: results.length, offset: parsed.data.offset },
  })
}
