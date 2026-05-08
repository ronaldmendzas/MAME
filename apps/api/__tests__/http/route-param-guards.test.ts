import { describe, expect, it, vi } from 'vitest'

import { handleCreateComment } from '../../src/http/routes/comment-create.js'
import { handleDeleteComment } from '../../src/http/routes/comment-delete.js'
import { handleGetComments } from '../../src/http/routes/comment-list.js'
import { handleAddLink } from '../../src/http/routes/evidence-link.js'
import { handleEvidenceList } from '../../src/http/routes/evidence-list.js'
import { handleEvidenceUpload } from '../../src/http/routes/evidence.js'
import { handleModerateReport } from '../../src/http/routes/moderation-action.js'
import { handleReportDetail } from '../../src/http/routes/report-detail.js'
import { handleAddVote } from '../../src/http/routes/vote-add.js'
import { handleRemoveVote } from '../../src/http/routes/vote-remove.js'

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: vi.fn().mockReturnValue({}),
}))
vi.mock('../../src/infrastructure/db/comment-repository.js', () => ({
  createCommentRepository: vi.fn().mockReturnValue({}),
}))
vi.mock('../../src/infrastructure/db/report-repository.js', () => ({
  createReportRepository: vi.fn().mockReturnValue({}),
}))
vi.mock('../../src/infrastructure/db/evidence-repository.js', () => ({
  createEvidenceRepository: vi.fn().mockReturnValue({}),
}))
vi.mock('../../src/infrastructure/db/vote-repository.js', () => ({
  createVoteRepository: vi.fn().mockReturnValue({}),
}))
vi.mock('../../src/infrastructure/storage/cloudinary.js', () => ({
  createCloudinaryStorage: vi.fn().mockReturnValue({}),
}))

function makeCtx(paramMap: Record<string, string | undefined> = {}, tokenId = 'tok-1') {
  return {
    req: {
      param: (key: string) => paramMap[key],
      json: vi.fn().mockResolvedValue({}),
      parseBody: vi.fn().mockResolvedValue({}),
      header: vi.fn().mockReturnValue(null),
    },
    env: { DATABASE_URL: 'postgres://localhost' },
    get: vi.fn().mockReturnValue(tokenId),
    json: vi.fn().mockReturnValue(new Response()),
  }
}

describe('route param guards — report ID', () => {
  it('handleCreateComment throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleCreateComment(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleGetComments throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleGetComments(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleAddLink throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleAddLink(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleEvidenceList throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleEvidenceList(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleEvidenceUpload throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleEvidenceUpload(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleModerateReport throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleModerateReport(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleReportDetail throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleReportDetail(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleAddVote throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleAddVote(ctx as never)).rejects.toThrow('Missing report ID')
  })

  it('handleRemoveVote throws ValidationError when report ID is missing', async () => {
    const ctx = makeCtx({ id: '' })
    await expect(handleRemoveVote(ctx as never)).rejects.toThrow('Missing report ID')
  })
})

describe('route param guards — comment ID', () => {
  it('handleDeleteComment throws ValidationError when comment ID is missing', async () => {
    const ctx = makeCtx({ commentId: '' })
    await expect(handleDeleteComment(ctx as never)).rejects.toThrow('Missing comment ID')
  })
})
