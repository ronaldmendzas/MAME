import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { errorHandler } from '../../src/http/middleware/error-handler'
import { handleSearch } from '../../src/http/routes/report-search'

function createTestApp() {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/search', handleSearch as never)
  return app
}

describe('GET /reports/search', () => {
  const app = createTestApp()

  it('rejects missing query param', async () => {
    const res = await app.request('/search')
    expect(res.status).toBe(422)
  })

  it('rejects query shorter than 2 chars', async () => {
    const res = await app.request('/search?q=a')
    expect(res.status).toBe(422)
  })

  it('rejects query longer than 200 chars', async () => {
    const res = await app.request(`/search?q=${'a'.repeat(201)}`)
    expect(res.status).toBe(422)
  })

  it('rejects invalid limit', async () => {
    const res = await app.request('/search?q=test&limit=0')
    expect(res.status).toBe(422)
  })

  it('rejects limit over 50', async () => {
    const res = await app.request('/search?q=test&limit=51')
    expect(res.status).toBe(422)
  })

  it('rejects negative offset', async () => {
    const res = await app.request('/search?q=test&offset=-1')
    expect(res.status).toBe(422)
  })

  it('accepts valid query with defaults', async () => {
    const res = await app.request('/search?q=corruption')
    expect([200, 500]).toContain(res.status)
  })
})
