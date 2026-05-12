import { Hono } from 'hono'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { AppEnv } from '../../src/env'
import { authMiddleware } from '../../src/http/middleware/auth'
import { errorHandler } from '../../src/http/middleware/error-handler'

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.use('/p/*', authMiddleware)
  app.get('/p/me', (c) =>
    c.json({
      userId: c.get('userId'),
      tokenId: c.get('tokenId'),
      role: c.get('userRole'),
    }),
  )
  return app
}

function makeRs256Token(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT', kid: 'test-kid' },
) {
  const h = btoa(JSON.stringify(header))
  const p = btoa(JSON.stringify(payload))
  return `${h}.${p}.fake-sig`
}

function requiredClaims(overrides?: Record<string, unknown>) {
  return {
    sub: 'u1',
    iss: 'https://vocal-longhorn-17.clerk.accounts.dev',
    aud: 'mame-api',
    exp: Math.floor(Date.now() / 1000) + 3600,
    nbf: Math.floor(Date.now() / 1000) - 30,
    iat: Math.floor(Date.now() / 1000) - 30,
    ...overrides,
  }
}

describe('authMiddleware JWT edge cases', () => {
  const app = createTestApp()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects empty bearer token', async () => {
    const res = await app.request('/p/me', {
      headers: { Authorization: 'Bearer ' },
    })
    expect(res.status).toBe(401)
  })

  it('rejects token with only 2 parts', async () => {
    const res = await app.request('/p/me', {
      headers: { Authorization: 'Bearer header.payload' },
    })
    expect(res.status).toBe(401)
  })

  it('rejects RS256 token with invalid JWKS fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }))
    const token = makeRs256Token(requiredClaims())
    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('JWKS')
  })

  it('rejects RS256 token when no matching kid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [] }), { status: 200 }),
    )
    const token = makeRs256Token(requiredClaims(), { alg: 'RS256', kid: 'nonexistent' })
    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('key')
  })

  it('rejects RS256 token without kid', async () => {
    const token = makeRs256Token(requiredClaims(), { alg: 'RS256', typ: 'JWT' })
    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('kid')
  })
})
