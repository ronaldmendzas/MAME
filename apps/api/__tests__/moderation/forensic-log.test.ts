import { describe, expect, it } from 'vitest'

import { createForensicLogRepository } from '../../src/infrastructure/db/forensic-log-repository'

function makeDb() {
  const inserted: unknown[] = []
  return {
    db: {
      insert: () => ({
        values: (data: unknown) => {
          inserted.push(data)
          return Promise.resolve()
        },
      }),
    },
    inserted,
  }
}

describe('forensic-log-repository', () => {
  it('inserts a rejection entry with formatted reason', async () => {
    const { db, inserted } = makeDb()
    const repo = createForensicLogRepository(db as never)

    await repo.logRejection({
      reportId: 'r-1',
      tokenId: 't-1',
      rejectionReason: 'NSFW detected',
      aiConfidence: 0.95,
      contentHash: 'abc123',
    })

    expect(inserted).toHaveLength(1)
    const entry = inserted[0] as Record<string, unknown>
    expect(entry['reportId']).toBe('r-1')
    expect(entry['moderatorToken']).toBe('t-1')
    expect(entry['action']).toBe('reject')
    expect(entry['reason']).toContain('[AI-AUTO]')
    expect(entry['reason']).toContain('NSFW detected')
    expect(entry['reason']).toContain('confidence=0.95')
    expect(entry['reason']).toContain('hash=abc123')
  })

  it('includes all forensic fields in reason string', async () => {
    const { db, inserted } = makeDb()
    const repo = createForensicLogRepository(db as never)

    await repo.logRejection({
      reportId: 'r-2',
      tokenId: 't-2',
      rejectionReason: 'drug content',
      aiConfidence: 0.87,
      contentHash: 'def456',
    })

    const entry = inserted[0] as Record<string, unknown>
    const reason = entry['reason'] as string
    expect(reason).toBe('[AI-AUTO] drug content | confidence=0.87 | hash=def456')
  })
})
