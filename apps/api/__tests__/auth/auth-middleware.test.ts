import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'

import type { AppEnv } from '../../src/env'
import { authMiddleware } from '../../src/http/middleware/auth'
import { errorHandler } from '../../src/http/middleware/error-handler'

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.use('/protected/*', authMiddleware)
  app.get('/protected/test', (c) => c.json({ ok: true }))
  app.get('/public/test', (c) => c.json({ ok: true }))
  return app
}

describe('authMiddleware', () => {
  const app = createTestApp()

  it('returns 401 when no Authorization header', async () => {
    const res = await app.request('/protected/test')
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Authorization')
  })

  it('returns 401 for non-Bearer token', async () => {
    const res = await app.request('/protected/test', {
      headers: { Authorization: 'Basic abc123' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for malformed JWT (wrong parts)', async () => {
    const res = await app.request('/protected/test', {
      headers: { Authorization: 'Bearer not.a.valid.jwt.token' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for JWT with wrong algorithm', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ sub: 'user_123', exp: 9999999999 }))
    const token = `${header}.${payload}.fake-signature`
    const res = await app.request('/protected/test', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('algorithm')
  })

  it('allows public routes without auth', async () => {
    const res = await app.request('/public/test')
    expect(res.status).toBe(200)
  })
})
