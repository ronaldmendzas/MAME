import { describe, expect, it, vi } from 'vitest'

import { updateReport } from '../../src/application/update-report'
import type { UpdateReportDeps } from '../../src/application/update-report'
import { ForbiddenError, NotFoundError, ValidationError } from '../../src/domain/errors'

const BASE_REPORT = {
  id: 'report-uuid',
  tokenId: 'token-123',
  title: 'Original Title',
  body: 'A'.repeat(100),
  category: 'fraud' as const,
  faculty: 'Engineering',
  status: 'draft' as const,
  votes: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: null,
}

function mockDeps(overrides?: Partial<UpdateReportDeps>): UpdateReportDeps {
  return {
    reportRepo: {
      insert: vi.fn(),
      findById: vi.fn().mockResolvedValue({ ...BASE_REPORT }),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn().mockResolvedValue({
        ...BASE_REPORT,
        title: 'Updated Title',
        updatedAt: new Date(),
      }),
    },
    ...overrides,
  }
}

describe('updateReport', () => {
  it('updates title when report is draft and user is owner', async () => {
    const deps = mockDeps()
    const result = await updateReport(
      { reportId: 'report-uuid', tokenId: 'token-123', title: 'Updated Title' },
      deps,
    )

    expect(deps.reportRepo.update).toHaveBeenCalledWith('report-uuid', { title: 'Updated Title' })
    expect(result.title).toBe('Updated Title')
  })

  it('throws NotFoundError when report does not exist', async () => {
    const deps = mockDeps({
      reportRepo: { ...mockDeps().reportRepo, findById: vi.fn().mockResolvedValue(null) },
    })

    await expect(updateReport({ reportId: 'missing', tokenId: 'token-123' }, deps)).rejects.toThrow(
      NotFoundError,
    )
  })

  it('throws ForbiddenError when user is not the owner', async () => {
    const deps = mockDeps()

    await expect(
      updateReport({ reportId: 'report-uuid', tokenId: 'other-token' }, deps),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ValidationError when report is not in draft status', async () => {
    const deps = mockDeps({
      reportRepo: {
        ...mockDeps().reportRepo,
        findById: vi.fn().mockResolvedValue({ ...BASE_REPORT, status: 'pending' }),
      },
    })

    await expect(
      updateReport({ reportId: 'report-uuid', tokenId: 'token-123', title: 'New' }, deps),
    ).rejects.toThrow(ValidationError)
  })

  it('only sends changed fields to repo.update', async () => {
    const deps = mockDeps()
    await updateReport(
      { reportId: 'report-uuid', tokenId: 'token-123', body: 'B'.repeat(100) },
      deps,
    )

    expect(deps.reportRepo.update).toHaveBeenCalledWith('report-uuid', { body: 'B'.repeat(100) })
  })
})
