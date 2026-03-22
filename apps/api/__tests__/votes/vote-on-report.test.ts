import { describe, expect, it, vi } from 'vitest'

import { voteOnReport, removeVote } from '../../src/application/vote-on-report'
import type { VoteOnReportDeps } from '../../src/application/vote-on-report'

function mockDeps(overrides?: Partial<VoteOnReportDeps>): VoteOnReportDeps {
  return {
    voteRepo: {
      insert: vi.fn().mockResolvedValue({
        id: 'vote-uuid',
        reportId: 'report-1',
        tokenId: 'token-1',
        createdAt: new Date(),
      }),
      findByReportAndToken: vi.fn().mockResolvedValue(null),
      deleteByReportAndToken: vi.fn(),
    },
    reportRepo: {
      insert: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'report-1',
        tokenId: 'author-token',
        title: 'Test',
        body: 'A'.repeat(100),
        category: 'fraud',
        faculty: 'Eng',
        status: 'published',
        votes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      }),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn(),
    },
    ...overrides,
  }
}

describe('voteOnReport', () => {
  const input = { reportId: 'report-1', tokenId: 'token-1' }

  it('creates a vote on a published report', async () => {
    const deps = mockDeps()
    const result = await voteOnReport(input, deps)

    expect(deps.voteRepo.insert).toHaveBeenCalledWith(input)
    expect(result.id).toBe('vote-uuid')
  })

  it('rejects vote on non-existent report', async () => {
    const deps = mockDeps({
      reportRepo: { ...mockDeps().reportRepo, findById: vi.fn().mockResolvedValue(null) },
    })
    await expect(voteOnReport(input, deps)).rejects.toThrow('not found')
  })

  it('rejects vote on unpublished report', async () => {
    const deps = mockDeps({
      reportRepo: {
        ...mockDeps().reportRepo,
        findById: vi.fn().mockResolvedValue({ id: 'r1', status: 'pending' }),
      },
    })
    await expect(voteOnReport(input, deps)).rejects.toThrow('Cannot vote on unpublished')
  })

  it('rejects duplicate vote (conflict)', async () => {
    const deps = mockDeps({
      voteRepo: {
        ...mockDeps().voteRepo,
        findByReportAndToken: vi.fn().mockResolvedValue({ id: 'existing-vote' }),
      },
    })
    await expect(voteOnReport(input, deps)).rejects.toThrow('already exists')
  })
})

describe('removeVote', () => {
  const input = { reportId: 'report-1', tokenId: 'token-1' }

  it('deletes an existing vote', async () => {
    const deps = mockDeps({
      voteRepo: {
        ...mockDeps().voteRepo,
        findByReportAndToken: vi.fn().mockResolvedValue({ id: 'vote-uuid' }),
      },
    })
    await removeVote(input, deps)

    expect(deps.voteRepo.deleteByReportAndToken).toHaveBeenCalledWith('report-1', 'token-1')
  })

  it('throws NotFoundError when no vote exists', async () => {
    const deps = mockDeps()
    await expect(removeVote(input, deps)).rejects.toThrow('not found')
  })
})
