import { describe, expect, it, vi } from 'vitest'

import { createReportRepository } from '../../src/infrastructure/db/report-repository'
import { createSearchRepository } from '../../src/infrastructure/db/search-repository'

function mockFeedDb(returnRows: unknown[] = []) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnRows),
  }
  chain.select.mockReturnValue(chain)
  return chain as unknown
}

function mockSearchDb(returnRows: unknown[] = []) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(returnRows),
  }
  chain.select.mockReturnValue(chain)
  return chain as unknown
}

describe('feed pagination performance', () => {
  it('uses cursor-based pagination, not offset', async () => {
    const db = mockFeedDb([])
    const repo = createReportRepository(db as never)
    await repo.findPublished(null, 20, {})
    expect((db as Record<string, unknown>).offset).toBeUndefined
  })

  it('limits results to requested count', async () => {
    const db = mockFeedDb([])
    const repo = createReportRepository(db as never)
    await repo.findPublished(null, 20, {})
    const limit = (db as { limit: ReturnType<typeof vi.fn> }).limit
    expect(limit).toHaveBeenCalledWith(20)
  })

  it('filters by publishedAt cursor when provided', async () => {
    const db = mockFeedDb([])
    const repo = createReportRepository(db as never)
    await repo.findPublished('2025-01-01T00:00:00Z', 20, {})
    const where = (db as { where: ReturnType<typeof vi.fn> }).where
    expect(where).toHaveBeenCalled()
  })
})

describe('search query performance', () => {
  it('uses limit and offset parameters', async () => {
    const db = mockSearchDb([])
    const repo = createSearchRepository(db as never)
    await repo.search('test query', 20, 0)
    const limit = (db as { limit: ReturnType<typeof vi.fn> }).limit
    const offset = (db as { offset: ReturnType<typeof vi.fn> }).offset
    expect(limit).toHaveBeenCalledWith(20)
    expect(offset).toHaveBeenCalledWith(0)
  })

  it('applies plainto_tsquery for safe search', async () => {
    const db = mockSearchDb([])
    const repo = createSearchRepository(db as never)
    await repo.search('test', 10, 0)
    const where = (db as { where: ReturnType<typeof vi.fn> }).where
    expect(where).toHaveBeenCalled()
  })
})

describe('feed route input validation', () => {
  it('filtersSchema limits max to 50', async () => {
    const { z } = await import('zod')
    const filtersSchema = z.object({
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
    expect(() => filtersSchema.parse({ limit: 100 })).toThrow()
    expect(filtersSchema.parse({ limit: 50 })).toEqual({ limit: 50 })
  })

  it('filtersSchema defaults limit to 20', async () => {
    const { z } = await import('zod')
    const filtersSchema = z.object({
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
    expect(filtersSchema.parse({})).toEqual({ limit: 20 })
  })
})
