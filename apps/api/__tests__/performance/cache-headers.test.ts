import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

import { errorHandler } from '../../src/http/middleware/error-handler.js'
import { handleFeed } from '../../src/http/routes/report-feed.js'
import { handleSearch } from '../../src/http/routes/report-search.js'

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: vi.fn().mockReturnValue({}),
}))

vi.mock('../../src/infrastructure/db/report-repository.js', () => ({
  createReportRepository: vi.fn().mockReturnValue({
    findPublished: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('../../src/infrastructure/db/search-repository.js', () => ({
  createSearchRepository: vi.fn().mockReturnValue({
    search: vi.fn().mockResolvedValue([]),
  }),
}))

const TEST_ENV = { DATABASE_URL: 'postgres://localhost/test' }

function createFeedApp() {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/reports', handleFeed as never)
  return app
}

function createSearchApp() {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/reports/search', handleSearch as never)
  return app
}

describe('Cache-Control — feed route', () => {
  const app = createFeedApp()

  it('returns public cache-control header', async () => {
    const res = await app.request('/reports', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('public')
  })

  it('sets s-maxage to 60 seconds', async () => {
    const res = await app.request('/reports', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('s-maxage=60')
  })

  it('sets stale-while-revalidate to 300 seconds', async () => {
    const res = await app.request('/reports', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('stale-while-revalidate=300')
  })

  it('returns 200 with success payload', async () => {
    const res = await app.request('/reports', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('rejects limit over 50', async () => {
    const res = await app.request('/reports?limit=51', {}, TEST_ENV)
    expect(res.status).toBe(422)
  })
})

describe('Cache-Control — search route', () => {
  const app = createSearchApp()

  it('returns public cache-control header', async () => {
    const res = await app.request('/reports/search?q=corruption', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('public')
  })

  it('sets s-maxage to 30 seconds', async () => {
    const res = await app.request('/reports/search?q=corruption', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('s-maxage=30')
  })

  it('sets stale-while-revalidate to 60 seconds', async () => {
    const res = await app.request('/reports/search?q=corruption', {}, TEST_ENV)
    const cc = res.headers.get('cache-control')
    expect(cc).toContain('stale-while-revalidate=60')
  })

  it('returns 200 with success payload and meta', async () => {
    const res = await app.request('/reports/search?q=corruption', {}, TEST_ENV)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.meta.query).toBe('corruption')
  })
})
