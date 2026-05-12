import { describe, expect, it, vi } from 'vitest'

import { moderateReport } from '../../src/application/moderate-report'
import type { ModerateReportDeps } from '../../src/application/moderate-report'

function mockDeps(overrides?: Partial<ModerateReportDeps>): ModerateReportDeps {
  return {
    reportRepo: {
      insert: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'report-1',
        tokenId: 'author-token',
        title: 'Report',
        body: 'A'.repeat(100),
        category: 'fraud',
        faculty: 'Engineering',
        status: 'pending',
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
      }),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn().mockResolvedValue({
        id: 'report-1',
        status: 'published',
        publishedAt: new Date(),
      }),
    },
    moderationLogRepo: {
      insert: vi.fn().mockResolvedValue({ id: 'log-1' }),
      findByReportId: vi.fn().mockResolvedValue([]),
    },
    statusHistoryRepo: {
      insert: vi.fn().mockResolvedValue({ id: 'hist-1' }),
      findByReportId: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  }
}

describe('moderateReport', () => {
  const baseInput = {
    reportId: 'report-1',
    moderatorToken: 'mod-token',
    moderatorFaculty: 'Science',
    action: 'approve' as const,
    reason: null,
  }

  it('approves a report and sets status to published', async () => {
    const deps = mockDeps()
    await moderateReport(baseInput, deps)

    expect(deps.reportRepo.update).toHaveBeenCalledWith('report-1', {
      status: 'published',
      publishedAt: expect.any(Date),
    })
    expect(deps.moderationLogRepo.insert).toHaveBeenCalled()
    expect(deps.statusHistoryRepo.insert).toHaveBeenCalled()
  })

  it('rejects faculty-conflict moderation', async () => {
    const deps = mockDeps()
    const input = { ...baseInput, moderatorFaculty: 'Engineering' }

    await expect(moderateReport(input, deps)).rejects.toThrow(
      'cannot moderate reports from their own faculty',
    )
  })

  it('rejects rejection without reason', async () => {
    const deps = mockDeps()
    const input = { ...baseInput, action: 'reject' as const, reason: null }

    await expect(moderateReport(input, deps)).rejects.toThrow('Reason is mandatory for rejection')
  })

  it('rejects non-existent report', async () => {
    const deps = mockDeps({
      reportRepo: { ...mockDeps().reportRepo, findById: vi.fn().mockResolvedValue(null) },
    })

    await expect(moderateReport(baseInput, deps)).rejects.toThrow('not found')
  })

  it('allows rejection with reason', async () => {
    const deps = mockDeps()
    const input = { ...baseInput, action: 'reject' as const, reason: 'Insufficient evidence' }

    await moderateReport(input, deps)

    expect(deps.reportRepo.update).toHaveBeenCalledWith('report-1', {
      status: 'rejected',
      publishedAt: null,
    })
  })
})
