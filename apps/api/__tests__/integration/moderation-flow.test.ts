import { describe, expect, it, vi } from 'vitest'

import { submitReport, type SubmitReportDeps, type SubmitReportInput } from '../../src/application/submit-report'
import type { EvidenceRow } from '../../src/domain/ports/evidence-repository'
import type { ModerationResult } from '../../src/domain/ports/moderation-port'
import type { ReportRow } from '../../src/domain/ports/report-repository'

const TOKEN = 'tok-123'

function makeReport(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: 'r-1', tokenId: TOKEN, title: 'Test', body: 'Body text',
    category: 'fraud', faculty: 'CS', status: 'draft',
    votes: 0, createdAt: new Date(), updatedAt: new Date(), publishedAt: null,
    ...overrides,
  }
}

function makeEvidence(mime = 'image/jpeg'): EvidenceRow {
  return {
    id: 'ev-1', reportId: 'r-1', type: 'file',
    fileKey: 'evidence/img-1', mimeType: mime, sizeBytes: 1024,
    createdAt: new Date(),
  }
}

function safeResult(): ModerationResult {
  return { flagged: false, categories: [], score: 0.05 }
}

function flaggedResult(cats = ['violence']): ModerationResult {
  return { flagged: true, categories: cats, score: 0.95 }
}

// eslint-disable-next-line max-params
function makeDeps(
  report: ReportRow,
  evidence: EvidenceRow[],
  textResult: ModerationResult,
  imageResult: ModerationResult = safeResult(),
): SubmitReportDeps {
  return {
    reportRepo: {
      findById: vi.fn().mockResolvedValue(report),
      update: vi.fn().mockResolvedValue(report),
      insert: vi.fn(), findPublished: vi.fn(), findByTokenId: vi.fn(),
    },
    evidenceRepo: {
      findByReportId: vi.fn().mockResolvedValue(evidence),
      insert: vi.fn(),
    },
    moderation: {
      classifyText: vi.fn().mockResolvedValue(textResult),
      classifyImage: vi.fn().mockResolvedValue(imageResult),
    },
    forensicLog: { logRejection: vi.fn() },
    storage: {
      upload: vi.fn(),
      getSignedUrl: vi.fn().mockReturnValue('https://cdn/signed'),
      delete: vi.fn(),
    },
  }
}

describe('moderation flow integration', () => {
  const input: SubmitReportInput = { reportId: 'r-1', tokenId: TOKEN }

  it('passes when text and images are safe', async () => {
    const deps = makeDeps(makeReport(), [makeEvidence()], safeResult())
    globalThis.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as never
    const result = await submitReport(input, deps)
    expect(result.outcome).toBe('submitted')
  })

  it('rejects when text is flagged', async () => {
    const deps = makeDeps(makeReport(), [makeEvidence('application/pdf')], flaggedResult(['hate']))
    const result = await submitReport(input, deps)
    expect(result).toEqual({ outcome: 'rejected', reason: 'hate' })
    expect(deps.forensicLog.logRejection).toHaveBeenCalled()
  })

  it('rejects when image is flagged', async () => {
    const deps = makeDeps(makeReport(), [makeEvidence()], safeResult(), flaggedResult(['nsfw']))
    globalThis.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as never
    const result = await submitReport(input, deps)
    expect(result).toEqual({ outcome: 'rejected', reason: 'nsfw' })
  })

  it('rejects with no evidence', async () => {
    const deps = makeDeps(makeReport(), [], safeResult())
    await expect(submitReport(input, deps)).rejects.toThrow('evidence')
  })

  it('rejects non-draft report', async () => {
    const deps = makeDeps(makeReport({ status: 'published' }), [makeEvidence()], safeResult())
    await expect(submitReport(input, deps)).rejects.toThrow('draft')
  })
})
