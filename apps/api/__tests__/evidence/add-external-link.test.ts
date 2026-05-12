import { describe, it, expect, vi } from 'vitest'

import { addExternalLink } from '../../src/application/add-external-link.js'

function makeDeps() {
  return {
    evidenceRepo: {
      insert: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'ev-1',
          ...data,
          createdAt: new Date(),
        }),
      ),
      findByReportId: vi.fn(),
    },
  }
}

describe('addExternalLink', () => {
  it('inserts a valid YouTube link', async () => {
    const deps = makeDeps()
    const row = await addExternalLink(
      { reportId: 'r-1', url: 'https://www.youtube.com/watch?v=abc123' },
      deps,
    )
    expect(row.type).toBe('external_link')
    expect(row.fileKey).toBe('https://www.youtube.com/watch?v=abc123')
    expect(row.mimeType).toBe('text/uri-list')
    expect(row.sizeBytes).toBe(0)
  })

  it('inserts a valid Google Drive link', async () => {
    const deps = makeDeps()
    const row = await addExternalLink(
      { reportId: 'r-1', url: 'https://drive.google.com/file/d/xyz' },
      deps,
    )
    expect(row.fileKey).toBe('https://drive.google.com/file/d/xyz')
  })

  it('rejects non-allowed hosts', async () => {
    const deps = makeDeps()
    await expect(
      addExternalLink({ reportId: 'r-1', url: 'https://evil.com/payload' }, deps),
    ).rejects.toThrow('URL host not allowed')
  })

  it('rejects invalid URLs', async () => {
    const deps = makeDeps()
    await expect(addExternalLink({ reportId: 'r-1', url: 'not-a-url' }, deps)).rejects.toThrow(
      'Invalid URL',
    )
  })

  it('accepts youtu.be short links', async () => {
    const deps = makeDeps()
    const row = await addExternalLink({ reportId: 'r-1', url: 'https://youtu.be/abc123' }, deps)
    expect(row.fileKey).toBe('https://youtu.be/abc123')
  })

  it('accepts Dropbox links', async () => {
    const deps = makeDeps()
    const row = await addExternalLink(
      { reportId: 'r-1', url: 'https://www.dropbox.com/s/file123' },
      deps,
    )
    expect(row.fileKey).toBe('https://www.dropbox.com/s/file123')
  })
})
