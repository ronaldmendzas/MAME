import { describe, it, expect, vi } from 'vitest'

import { submitReport } from '../../src/application/submit-report.js'
import type { ReportRow } from '../../src/domain/ports/report-repository.js'

const safeMod = { flagged: false, categories: [], score: 0 }
const unsafeMod = { flagged: true, categories: ['violence'], score: 0.9 }

function makeReport(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: 'r-1',
    tokenId: 'tok-1',
    title: 'Test Report Title',
    body: 'A'.repeat(100),
    category: 'academic_fraud',
    faculty: 'Engineering',
    status: 'draft',
    votes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    ...overrides,
  }
}

function makeDeps(report: ReportRow | null = makeReport()) {
  return {
    reportRepo: {
      insert: vi.fn(),
      findById: vi.fn().mockResolvedValue(report),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn().mockResolvedValue({ ...report, status: 'rejected' }),
    },
    evidenceRepo: {
      insert: vi.fn(),
      findByReportId: vi.fn().mockResolvedValue([
        {
          id: 'e1',
          reportId: 'r-1',
          type: 'document',
          fileKey: 'k1',
          mimeType: 'application/pdf',
          sizeBytes: 100,
          createdAt: new Date(),
        },
      ]),
    },
    moderation: {
      classifyText: vi.fn().mockResolvedValue(safeMod),
      classifyImage: vi.fn().mockResolvedValue(safeMod),
    },
    forensicLog: {
      logRejection: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      upload: vi.fn(),
      delete: vi.fn(),
      getSignedUrl: vi.fn().mockReturnValue('https://signed.url/img'),
    },
  }
}

describe('submitReport', () => {
  const input = { reportId: 'r-1', tokenId: 'tok-1' }

  it('returns submitted when content is safe', async () => {
    const deps = makeDeps()
    const result = await submitReport(input, deps)
    expect(result).toEqual({ outcome: 'submitted' })
    expect(deps.reportRepo.update).toHaveBeenCalledWith('r-1', { status: 'pending' })
  })

  it('throws if report not found', async () => {
    const deps = makeDeps(null)
    await expect(submitReport(input, deps)).rejects.toThrow('Report not found')
  })

  it('throws if not the author', async () => {
    const deps = makeDeps(makeReport({ tokenId: 'other' }))
    await expect(submitReport(input, deps)).rejects.toThrow('Not the author')
  })

  it('throws if no evidence', async () => {
    const deps = makeDeps()
    deps.evidenceRepo.findByReportId.mockResolvedValue([])
    await expect(submitReport(input, deps)).rejects.toThrow('At least one evidence')
  })

  it('rejects when text is flagged', async () => {
    const deps = makeDeps()
    deps.moderation.classifyText.mockResolvedValue(unsafeMod)

    const result = await submitReport(input, deps)

    expect(result).toEqual({ outcome: 'rejected', reason: 'violence' })
    expect(deps.reportRepo.update).toHaveBeenCalledWith('r-1', { status: 'rejected' })
    expect(deps.forensicLog.logRejection).toHaveBeenCalled()
  })

  it('classifies text before images', async () => {
    const deps = makeDeps()
    deps.moderation.classifyText.mockResolvedValue(unsafeMod)

    await submitReport(input, deps)

    expect(deps.moderation.classifyImage).not.toHaveBeenCalled()
  })
})
