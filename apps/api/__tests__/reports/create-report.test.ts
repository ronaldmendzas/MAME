import { describe, expect, it, vi } from 'vitest'

import { createReport } from '../../src/application/create-report'
import type { CreateReportDeps } from '../../src/application/create-report'

function mockDeps(overrides?: Partial<CreateReportDeps>): CreateReportDeps {
  return {
    reportRepo: {
      insert: vi.fn().mockResolvedValue({
        id: 'report-uuid',
        tokenId: 'token-123',
        title: 'Test Report',
        body: 'A'.repeat(100),
        category: 'fraud',
        faculty: 'Engineering',
        status: 'pending',
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
      }),
      findById: vi.fn(),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn(),
    },
    ...overrides,
  }
}

describe('createReport', () => {
  const input = {
    tokenId: 'token-123',
    title: 'Test Report',
    body: 'A'.repeat(100),
    category: 'fraud' as const,
    faculty: 'Engineering',
  }

  it('inserts report with pending status', async () => {
    const deps = mockDeps()
    const result = await createReport(input, deps)

    expect(deps.reportRepo.insert).toHaveBeenCalledWith({
      ...input,
      status: 'pending',
    })
    expect(result.id).toBe('report-uuid')
    expect(result.status).toBe('pending')
  })

  it('returns the created report row', async () => {
    const deps = mockDeps()
    const result = await createReport(input, deps)

    expect(result.tokenId).toBe('token-123')
    expect(result.title).toBe('Test Report')
    expect(result.category).toBe('fraud')
    expect(result.votes).toBe(0)
    expect(result.publishedAt).toBeNull()
  })

  it('propagates repository errors', async () => {
    const deps = mockDeps({
      reportRepo: {
        ...mockDeps().reportRepo,
        insert: vi.fn().mockRejectedValue(new Error('DB error')),
      },
    })

    await expect(createReport(input, deps)).rejects.toThrow('DB error')
  })
})
