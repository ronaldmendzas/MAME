import { describe, it, expect, vi } from 'vitest'

import { screenImages } from '../../src/application/screen-images.js'
import type { EvidenceRow } from '../../src/domain/ports/evidence-repository.js'

function makeEvidence(overrides: Partial<EvidenceRow> = {}): EvidenceRow {
  return {
    id: 'ev-1',
    reportId: 'r-1',
    type: 'document',
    fileKey: 'key-1',
    mimeType: 'image/png',
    sizeBytes: 1024,
    createdAt: new Date(),
    ...overrides,
  }
}

const safeMod = { flagged: false, categories: [], score: 0 }
const unsafeMod = { flagged: true, categories: ['nsfw'], score: 0.95 }

function makeDeps(imageResult = safeMod) {
  return {
    moderation: {
      classifyText: vi.fn(),
      classifyImage: vi.fn().mockResolvedValue(imageResult),
    },
    storage: {
      upload: vi.fn(),
      delete: vi.fn(),
      getSignedUrl: vi.fn().mockReturnValue('https://signed.url/img'),
    },
  }
}

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
}))

describe('screenImages', () => {
  it('returns null when no images present', async () => {
    const deps = makeDeps()
    const result = await screenImages(
      [makeEvidence({ mimeType: 'application/pdf' })],
      deps,
    )
    expect(result).toBeNull()
    expect(deps.moderation.classifyImage).not.toHaveBeenCalled()
  })

  it('returns null when all images safe', async () => {
    const deps = makeDeps(safeMod)
    const result = await screenImages(
      [makeEvidence(), makeEvidence({ id: 'ev-2', fileKey: 'key-2' })],
      deps,
    )
    expect(result).toBeNull()
    expect(deps.moderation.classifyImage).toHaveBeenCalledTimes(2)
  })

  it('returns first flagged result', async () => {
    const deps = makeDeps()
    deps.moderation.classifyImage
      .mockResolvedValueOnce(safeMod)
      .mockResolvedValueOnce(unsafeMod)

    const result = await screenImages(
      [makeEvidence(), makeEvidence({ id: 'ev-2', fileKey: 'key-2' })],
      deps,
    )
    expect(result).toEqual(unsafeMod)
  })

  it('fetches signed url for each image', async () => {
    const deps = makeDeps()
    await screenImages([makeEvidence()], deps)
    expect(deps.storage.getSignedUrl).toHaveBeenCalledWith('key-1', 60)
  })
})
