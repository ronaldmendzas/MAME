import { describe, expect, it, vi } from 'vitest'

import { uploadEvidence } from '../../src/application/upload-evidence.js'
import type { EvidenceRepository, EvidenceRow } from '../../src/domain/ports/evidence-repository.js'
import type { StoragePort } from '../../src/domain/ports/storage-port.js'

const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)])

function makeStorage(): StoragePort {
  return {
    upload: vi.fn().mockResolvedValue({ fileKey: 'evidence/abc', url: 'https://cdn/abc', bytes: 100 }),
    getSignedUrl: vi.fn().mockReturnValue('https://cdn/signed'),
    delete: vi.fn().mockResolvedValue(undefined),
  }
}

function makeRepo(): EvidenceRepository {
  const row: EvidenceRow = {
    id: 'uuid-1',
    reportId: 'report-1',
    type: 'file',
    fileKey: 'evidence/abc',
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    createdAt: new Date(),
  }
  return {
    insert: vi.fn().mockResolvedValue(row),
    findByReportId: vi.fn().mockResolvedValue([row]),
  }
}

describe('uploadEvidence', () => {
  it('uploads valid JPEG file', async () => {
    const storage = makeStorage()
    const repo = makeRepo()
    const result = await uploadEvidence(
      { reportId: 'report-1', file: JPEG_HEADER.buffer, filename: 'photo.jpg' },
      { storage, evidenceRepo: repo },
    )
    expect(result.type).toBe('file')
    expect(storage.upload).toHaveBeenCalledOnce()
    expect(repo.insert).toHaveBeenCalledOnce()
  })

  it('rejects empty file', async () => {
    await expect(
      uploadEvidence(
        { reportId: 'r1', file: new ArrayBuffer(0), filename: 'x.jpg' },
        { storage: makeStorage(), evidenceRepo: makeRepo() },
      ),
    ).rejects.toThrow('File is empty')
  })

  it('rejects oversized file', async () => {
    const big = new ArrayBuffer(6 * 1024 * 1024)
    await expect(
      uploadEvidence(
        { reportId: 'r1', file: big, filename: 'big.jpg' },
        { storage: makeStorage(), evidenceRepo: makeRepo() },
      ),
    ).rejects.toThrow('File exceeds 5 MB limit')
  })

  it('rejects unsupported file type', async () => {
    const unknown = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer
    await expect(
      uploadEvidence(
        { reportId: 'r1', file: unknown, filename: 'data.bin' },
        { storage: makeStorage(), evidenceRepo: makeRepo() },
      ),
    ).rejects.toThrow('Unsupported file type')
  })

  it('rejects JPEG with residual EXIF data', async () => {
    const exif = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x00, 0x00,
      0xff, 0xda, ...new Array(50).fill(0),
    ])
    await expect(
      uploadEvidence(
        { reportId: 'r1', file: exif.buffer, filename: 'exif.jpg' },
        { storage: makeStorage(), evidenceRepo: makeRepo() },
      ),
    ).rejects.toThrow('EXIF metadata')
  })

  it('rejects PDF with residual metadata', async () => {
    const pdfContent = '%PDF-1.4\n/Author (John Doe)\n%%EOF'
    const pdfBuffer = new TextEncoder().encode(pdfContent).buffer
    await expect(
      uploadEvidence(
        { reportId: 'r1', file: pdfBuffer, filename: 'doc.pdf' },
        { storage: makeStorage(), evidenceRepo: makeRepo() },
      ),
    ).rejects.toThrow('PDF contains residual metadata')
  })

  it('uploads clean PDF without metadata', async () => {
    const pdfContent = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF'
    const pdfBuffer = new TextEncoder().encode(pdfContent).buffer
    const storage = makeStorage()
    const repo = makeRepo()
    const result = await uploadEvidence(
      { reportId: 'report-1', file: pdfBuffer, filename: 'clean.pdf' },
      { storage, evidenceRepo: repo },
    )
    expect(result.type).toBe('file')
    expect(storage.upload).toHaveBeenCalledOnce()
  })
})
