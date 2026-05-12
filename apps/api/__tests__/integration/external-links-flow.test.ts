import { describe, expect, it, vi } from 'vitest'

import { addExternalLink } from '../../src/application/add-external-link'
import type { EvidenceRow } from '../../src/domain/ports/evidence-repository'

function makeRepo() {
  const rows: EvidenceRow[] = []
  return {
    insert: vi.fn().mockImplementation((data) => {
      const row: EvidenceRow = {
        id: `ev-${rows.length + 1}`,
        reportId: data.reportId,
        type: data.type,
        fileKey: data.fileKey,
        mimeType: data.mimeType,
        sizeBytes: 0,
        createdAt: new Date(),
      }
      rows.push(row)
      return Promise.resolve(row)
    }),
    findByReportId: vi.fn().mockImplementation(() => Promise.resolve(rows)),
    rows,
  }
}

describe('external link integration', () => {
  it('adds youtube link and counts evidence', async () => {
    const repo = makeRepo()
    await addExternalLink(
      { reportId: 'r-1', url: 'https://youtube.com/watch?v=abc' },
      { evidenceRepo: repo },
    )
    expect(repo.rows).toHaveLength(1)
    expect(repo.rows[0]?.type).toBe('external_link')
    expect(repo.rows[0]?.mimeType).toBe('text/uri-list')
  })

  it('rejects disallowed host', async () => {
    const repo = makeRepo()
    await expect(
      addExternalLink({ reportId: 'r-1', url: 'https://evil.com/phish' }, { evidenceRepo: repo }),
    ).rejects.toThrow('not allowed')
    expect(repo.rows).toHaveLength(0)
  })

  it('rejects invalid URL format', async () => {
    const repo = makeRepo()
    await expect(
      addExternalLink({ reportId: 'r-1', url: 'not-a-url' }, { evidenceRepo: repo }),
    ).rejects.toThrow('Invalid URL')
  })

  it('accepts multiple allowed hosts', async () => {
    const repo = makeRepo()
    const urls = [
      'https://drive.google.com/file/d/123',
      'https://www.dropbox.com/s/abc/file.pdf',
      'https://youtu.be/xyz',
    ]
    for (const url of urls) {
      await addExternalLink({ reportId: 'r-1', url }, { evidenceRepo: repo })
    }
    expect(repo.rows).toHaveLength(3)
  })
})
