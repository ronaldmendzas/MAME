import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { optionalAuthMiddleware } from '../../src/http/middleware/optional-auth'

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.use('/test', optionalAuthMiddleware)
  app.get('/test', (c) =>
    c.json({
      userId: c.get('userId'),
      tokenId: c.get('tokenId'),
      userRole: c.get('userRole'),
    }),
  )
  return app
}

describe('optionalAuthMiddleware', () => {
  const app = createTestApp()

  it('sets empty values when no Authorization header', async () => {
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, string>
    expect(body.userId).toBe('')
    expect(body.tokenId).toBe('')
    expect(body.userRole).toBe('')
  })

  it('sets empty values for non-Bearer token', async () => {
    const res = await app.request('/test', {
      headers: { Authorization: 'Basic abc123' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, string>
    expect(body.userId).toBe('')
    expect(body.tokenId).toBe('')
  })

  it('sets empty values for invalid JWT (graceful fallback)', async () => {
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, string>
    expect(body.userId).toBe('')
    expect(body.tokenId).toBe('')
    expect(body.userRole).toBe('')
  })

  it('does not throw for malformed Bearer value', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const payload = btoa(JSON.stringify({ sub: 'user_1' }))
    const res = await app.request('/test', {
      headers: { Authorization: `Bearer ${header}.${payload}.sig` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, string>
    expect(body.userId).toBe('')
  })
})
