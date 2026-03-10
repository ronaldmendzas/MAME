import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { optionalAuthMiddleware } from '../../src/http/middleware/optional-auth'
import { handleReportDetail } from '../../src/http/routes/report-detail'

// Mock the DB layer
const mockFindById = vi.fn()

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: () => ({}),
}))

vi.mock('../../src/infrastructure/db/report-repository.js', () => ({
  createReportRepository: () => ({
    findById: mockFindById,
  }),
}))

vi.mock('../../src/infrastructure/db/evidence-repository.js', () => ({
  createEvidenceRepository: () => ({
    findByReportId: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('../../src/infrastructure/db/comment-repository.js', () => ({
  createCommentRepository: () => ({
    countByReportId: vi.fn().mockResolvedValue(0),
  }),
}))

vi.mock('../../src/domain/media-signature.js', () => ({
  signMediaUrl: vi.fn().mockResolvedValue('https://signed-url'),
}))

const TEST_ENV = { DATABASE_URL: 'postgresql://test', ENCRYPTION_MASTER_KEY: 'test-secret' }

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    tokenId: 'author-token-123',
    title: 'Test report',
    body: 'Test body',
    category: 'fraud',
    faculty: 'Engineering',
    status: 'published',
    votes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    ...overrides,
  }
}

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.get('/:id', optionalAuthMiddleware, handleReportDetail)
  return app
}

describe('handleReportDetail permissions', () => {
  const app = createTestApp()

  it('returns published report to anonymous visitor', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'published' }))
    const res = await app.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
  })

  it('returns 404 for draft report to anonymous visitor', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'draft' }))
    const res = await app.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('returns 404 for under_review report to anonymous visitor', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'under_review' }))
    const res = await app.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('returns 404 for rejected report to anonymous visitor', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'rejected' }))
    const res = await app.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('returns 404 for non-existent report', async () => {
    mockFindById.mockResolvedValueOnce(null)
    const res = await app.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('author can see their own draft report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'draft', tokenId: 'author-token-123' }))

    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      sub: 'user_1',
      exp: Math.floor(Date.now() / 1000) + 3600,
      metadata: { token_id: 'author-token-123', role: 'user' },
    }))

    // optionalAuth won't verify the JWT signature (it catches errors),
    // but we need the payload to be parseable. Since optionalAuth _does_ call verifyJwt
    // which will throw (invalid sig), it'll fallback to empty context.
    // So we need a different approach: test the handler logic directly.

    // Let's test with a manual Hono app that sets the context directly
    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'author-token-123')
      c.set('userRole', 'user')
      c.set('userId', 'user_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('draft')
  })

  it('author can see their own rejected report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'rejected', tokenId: 'author-token-123' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'author-token-123')
      c.set('userRole', 'user')
      c.set('userId', 'user_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { status: string } }
    expect(body.data.status).toBe('rejected')
  })

  it('author can see their own under_review report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'under_review', tokenId: 'author-token-123' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'author-token-123')
      c.set('userRole', 'user')
      c.set('userId', 'user_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
  })

  it('moderator can see under_review report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'under_review', tokenId: 'other-author' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'mod-token')
      c.set('userRole', 'moderator')
      c.set('userId', 'mod_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { status: string } }
    expect(body.data.status).toBe('under_review')
  })

  it('admin can see under_review report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'under_review', tokenId: 'other-author' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'admin-token')
      c.set('userRole', 'admin')
      c.set('userId', 'admin_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(200)
  })

  it('moderator cannot see draft report of another user', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'draft', tokenId: 'other-author' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'mod-token')
      c.set('userRole', 'moderator')
      c.set('userId', 'mod_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('regular user cannot see another user draft report', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'draft', tokenId: 'other-author' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'different-user')
      c.set('userRole', 'user')
      c.set('userId', 'user_2')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })

  it('moderator cannot see rejected report of another user', async () => {
    mockFindById.mockResolvedValueOnce(makeReport({ status: 'rejected', tokenId: 'other-author' }))

    const directApp = new Hono<AppEnv>()
    directApp.onError(errorHandler)
    directApp.use('/:id', async (c, next) => {
      c.set('tokenId', 'mod-token')
      c.set('userRole', 'moderator')
      c.set('userId', 'mod_1')
      await next()
    })
    directApp.get('/:id', handleReportDetail)

    const res = await directApp.request('/00000000-0000-0000-0000-000000000001', {}, TEST_ENV)
    expect(res.status).toBe(404)
  })
})
