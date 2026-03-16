import { describe, expect, it, vi } from 'vitest'

import { createComment } from '../../src/application/create-comment'
import type { CreateCommentDeps } from '../../src/application/create-comment'

function mockDeps(overrides?: Partial<CreateCommentDeps>): CreateCommentDeps {
  return {
    commentRepo: {
      insert: vi.fn().mockResolvedValue({
        id: 'comment-uuid',
        reportId: 'report-1',
        tokenId: 'token-1',
        parentId: null,
        body: 'Test comment',
        createdAt: new Date(),
      }),
      findByReportId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      deleteById: vi.fn(),
      countByReportId: vi.fn().mockResolvedValue(0),
    },
    reportRepo: {
      insert: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'report-1',
        tokenId: 'token-1',
        title: 'Test',
        body: 'A'.repeat(100),
        category: 'fraud',
        faculty: 'Eng',
        status: 'published',
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      }),
      findPublished: vi.fn(),
      findByTokenId: vi.fn(),
      update: vi.fn(),
    },
    ...overrides,
  }
}

describe('createComment', () => {
  const input = {
    reportId: 'report-1',
    tokenId: 'token-1',
    parentId: null,
    body: 'This is a valid test comment',
  }

  it('inserts a top-level comment', async () => {
    const deps = mockDeps()
    const result = await createComment(input, deps)

    expect(deps.commentRepo.insert).toHaveBeenCalledWith(input)
    expect(result.id).toBe('comment-uuid')
  })

  it('rejects empty body', async () => {
    const deps = mockDeps()
    await expect(createComment({ ...input, body: '  ' }, deps))
      .rejects.toThrow('Comment body is required')
  })

  it('rejects body exceeding 1000 characters', async () => {
    const deps = mockDeps()
    await expect(createComment({ ...input, body: 'A'.repeat(1001) }, deps))
      .rejects.toThrow('must not exceed 1000 characters')
  })

  it('rejects comment on non-existent report', async () => {
    const deps = mockDeps({
      reportRepo: {
        ...mockDeps().reportRepo,
        findById: vi.fn().mockResolvedValue(null),
      },
    })
    await expect(createComment(input, deps)).rejects.toThrow('not found')
  })

  it('rejects comment on unpublished report', async () => {
    const deps = mockDeps({
      reportRepo: {
        ...mockDeps().reportRepo,
        findById: vi.fn().mockResolvedValue({
          id: 'report-1',
          status: 'pending',
          tokenId: 'token-1',
          title: 'T',
          body: 'B',
          category: 'fraud',
          faculty: 'Eng',
          votes: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: null,
        }),
      },
    })
    await expect(createComment(input, deps))
      .rejects.toThrow('Cannot comment on unpublished')
  })

  it('allows 1-level nested reply', async () => {
    const deps = mockDeps({
      commentRepo: {
        ...mockDeps().commentRepo,
        findById: vi.fn().mockResolvedValue({
          id: 'parent-comment',
          reportId: 'report-1',
          tokenId: 'token-2',
          parentId: null,
          body: 'Parent',
          createdAt: new Date(),
        }),
      },
    })
    const result = await createComment(
      { ...input, parentId: 'parent-comment' },
      deps,
    )
    expect(result.id).toBe('comment-uuid')
  })

  it('rejects 3rd-level nesting', async () => {
    const deps = mockDeps({
      commentRepo: {
        ...mockDeps().commentRepo,
        findById: vi.fn().mockResolvedValue({
          id: 'child-comment',
          reportId: 'report-1',
          tokenId: 'token-2',
          parentId: 'parent-comment',
          body: 'Child',
          createdAt: new Date(),
        }),
      },
    })
    await expect(
      createComment({ ...input, parentId: 'child-comment' }, deps),
    ).rejects.toThrow('nested 2 levels deep')
  })
})
