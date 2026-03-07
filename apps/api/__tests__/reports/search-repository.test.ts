import { describe, expect, it, vi } from 'vitest'

import type { SearchRepository, SearchResult } from '../../src/domain/ports/search-repository'

function mockResult(overrides?: Partial<SearchResult>): SearchResult {
  return {
    id: 'report-1',
    tokenId: 'token-1',
    title: 'Test Report',
    body: 'A'.repeat(100),
    category: 'fraud',
    faculty: 'Engineering',
    status: 'published',
    votes: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    rank: 0.8,
    ...overrides,
  }
}

function mockSearchRepo(results: SearchResult[] = []): SearchRepository {
  return { search: vi.fn().mockResolvedValue(results) }
}

describe('SearchRepository port', () => {
  it('returns results matching query', async () => {
    const results = [mockResult(), mockResult({ id: 'report-2', rank: 0.5 })]
    const repo = mockSearchRepo(results)

    const found = await repo.search('test', 20, 0)
    expect(found).toHaveLength(2)
    expect(found[0]!.rank).toBe(0.8)
    expect(found[1]!.rank).toBe(0.5)
  })

  it('returns empty array when no matches', async () => {
    const repo = mockSearchRepo([])
    const found = await repo.search('nonexistent', 20, 0)
    expect(found).toHaveLength(0)
  })

  it('passes correct parameters to search', async () => {
    const repo = mockSearchRepo([])
    await repo.search('corruption', 10, 5)
    expect(repo.search).toHaveBeenCalledWith('corruption', 10, 5)
  })

  it('results include rank field', async () => {
    const repo = mockSearchRepo([mockResult({ rank: 0.95 })])
    const found = await repo.search('test', 20, 0)
    expect(found[0]!.rank).toBe(0.95)
  })
})
