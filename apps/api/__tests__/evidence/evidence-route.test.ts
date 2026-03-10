import { describe, expect, it, vi } from 'vitest'

import { handleEvidenceUpload } from '../../src/http/routes/evidence.js'

vi.mock('../../src/application/upload-evidence.js', () => ({
  uploadEvidence: vi.fn().mockResolvedValue({
    id: 'ev-1', reportId: 'r-1', type: 'file',
    fileKey: 'evidence/abc', mimeType: 'image/jpeg',
    sizeBytes: 200, createdAt: new Date(),
  }),
}))

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: vi.fn().mockReturnValue({}),
}))

vi.mock('../../src/infrastructure/db/evidence-repository.js', () => ({
  createEvidenceRepository: vi.fn().mockReturnValue({}),
}))

vi.mock('../../src/infrastructure/storage/cloudinary.js', () => ({
  createCloudinaryStorage: vi.fn().mockReturnValue({}),
}))

function makeContext(id: string, file?: File) {
  return {
    req: {
      param: (key: string) => (key === 'id' ? id : ''),
      parseBody: vi.fn().mockResolvedValue({ file: file ?? 'not-a-file' }),
    },
    env: {
      DATABASE_URL: 'postgres://localhost',
      CLOUDINARY_CLOUD_NAME: 'test',
      CLOUDINARY_API_KEY: 'key',
      CLOUDINARY_API_SECRET: 'secret',
    },
    json: vi.fn().mockReturnValue(new Response()),
  }
}

describe('handleEvidenceUpload', () => {
  it('rejects invalid report ID', async () => {
    const ctx = makeContext('not-uuid')
    await expect(handleEvidenceUpload(ctx as never)).rejects.toThrow('Invalid report ID')
  })

  it('rejects missing file', async () => {
    const ctx = makeContext('550e8400-e29b-41d4-a716-446655440000')
    await expect(handleEvidenceUpload(ctx as never)).rejects.toThrow('Missing file')
  })

  it('uploads valid file', async () => {
    const file = new File(['hello'], 'test.jpg', { type: 'image/jpeg' })
    const ctx = makeContext('550e8400-e29b-41d4-a716-446655440000', file)
    await handleEvidenceUpload(ctx as never)
    expect(ctx.json).toHaveBeenCalled()
  })
})
