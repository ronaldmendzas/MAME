import { describe, expect, it, vi } from 'vitest'

import { uploadEvidence } from '../../src/application/upload-evidence.js'
import { hasExifData } from '../../src/domain/exif-check.js'
import { detectMimeType, isAllowedType } from '../../src/domain/magic-bytes.js'
import { signMediaUrl, verifyMediaSignature } from '../../src/domain/media-signature.js'
import type { EvidenceRepository, EvidenceRow } from '../../src/domain/ports/evidence-repository.js'
import type { StoragePort } from '../../src/domain/ports/storage-port.js'

const SECRET = 'integration-test-secret'
const BASE_URL = 'https://api.test'
const CLEAN_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)])

function makeDeps() {
  const row: EvidenceRow = {
    id: 'ev-1',
    reportId: 'r-1',
    type: 'file',
    fileKey: 'evidence/test-id',
    mimeType: 'image/jpeg',
    sizeBytes: CLEAN_JPEG.byteLength,
    createdAt: new Date(),
  }
  const storage: StoragePort = {
    upload: vi.fn().mockResolvedValue({
      fileKey: 'evidence/test-id',
      url: 'https://cdn/test-id',
      bytes: CLEAN_JPEG.byteLength,
    }),
    getSignedUrl: vi.fn(),
    delete: vi.fn(),
  }
  const repo: EvidenceRepository = {
    insert: vi.fn().mockResolvedValue(row),
    findByReportId: vi.fn().mockResolvedValue([row]),
  }
  return { storage, repo, row }
}

describe('evidence pipeline integration', () => {
  it('validates, uploads, and generates verifiable signed URL', async () => {
    const { storage, repo } = makeDeps()

    const mime = detectMimeType(CLEAN_JPEG.buffer)
    expect(mime).toBe('image/jpeg')
    expect(isAllowedType(mime!)).toBe(true)
    expect(hasExifData(CLEAN_JPEG.buffer)).toBe(false)

    const evidence = await uploadEvidence(
      { reportId: 'r-1', file: CLEAN_JPEG.buffer, filename: 't.jpg' },
      { storage, evidenceRepo: repo },
    )

    const url = await signMediaUrl(BASE_URL, evidence.fileKey, SECRET)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    expect(await verifyMediaSignature(evidence.fileKey, expires, sig, SECRET)).toBe(true)
  })

  it('rejects EXIF-tainted JPEG in full pipeline', async () => {
    const tainted = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0xe1,
      0x00,
      0x04,
      0x00,
      0x00,
      0xff,
      0xda,
      ...new Array(50).fill(0),
    ])

    expect(detectMimeType(tainted.buffer)).toBe('image/jpeg')
    expect(hasExifData(tainted.buffer)).toBe(true)

    const { storage, repo } = makeDeps()
    await expect(
      uploadEvidence(
        { reportId: 'r-1', file: tainted.buffer, filename: 'exif.jpg' },
        { storage, evidenceRepo: repo },
      ),
    ).rejects.toThrow('EXIF metadata')
  })

  it('rejects unknown file types before reaching storage', async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer
    expect(detectMimeType(garbage)).toBeNull()

    const { storage, repo } = makeDeps()
    await expect(
      uploadEvidence(
        { reportId: 'r-1', file: garbage, filename: 'data.bin' },
        { storage, evidenceRepo: repo },
      ),
    ).rejects.toThrow('Unsupported file type')
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('signed URL expires correctly', async () => {
    const { storage, repo } = makeDeps()
    const evidence = await uploadEvidence(
      { reportId: 'r-1', file: CLEAN_JPEG.buffer, filename: 't.jpg' },
      { storage, evidenceRepo: repo },
    )

    const url = await signMediaUrl(BASE_URL, evidence.fileKey, SECRET, -1)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    expect(await verifyMediaSignature(evidence.fileKey, expires, sig, SECRET)).toBe(false)
  })

  it('validates PNG files through the pipeline', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(100).fill(0)])
    expect(detectMimeType(png.buffer)).toBe('image/png')

    const row: EvidenceRow = {
      id: 'ev-2',
      reportId: 'r-1',
      type: 'file',
      fileKey: 'evidence/png-id',
      mimeType: 'image/png',
      sizeBytes: png.byteLength,
      createdAt: new Date(),
    }
    const storage: StoragePort = {
      upload: vi.fn().mockResolvedValue({
        fileKey: 'evidence/png-id',
        url: 'https://cdn/png',
        bytes: png.byteLength,
      }),
      getSignedUrl: vi.fn(),
      delete: vi.fn(),
    }
    const repo: EvidenceRepository = {
      insert: vi.fn().mockResolvedValue(row),
      findByReportId: vi.fn().mockResolvedValue([row]),
    }

    const evidence = await uploadEvidence(
      { reportId: 'r-1', file: png.buffer, filename: 'img.png' },
      { storage, evidenceRepo: repo },
    )

    const url = await signMediaUrl(BASE_URL, evidence.fileKey, SECRET)
    const parsed = new URL(url)
    expect(
      await verifyMediaSignature(
        evidence.fileKey,
        parsed.searchParams.get('expires')!,
        parsed.searchParams.get('sig')!,
        SECRET,
      ),
    ).toBe(true)
  })
})
