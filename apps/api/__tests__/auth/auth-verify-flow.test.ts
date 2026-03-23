import { Hono } from 'hono'
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest'

import type { AppEnv } from '../../src/env'
import { authMiddleware } from '../../src/http/middleware/auth'
import { errorHandler } from '../../src/http/middleware/error-handler'

function base64Url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateRsaKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
}

async function signJwt(
  payload: Record<string, unknown>,
  privateKey: CryptoKey,
  kid = 'test-kid',
): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }))
  const body = base64Url(JSON.stringify(payload))
  const data = new TextEncoder().encode(`${header}.${body}`)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data)
  const sigB64 = base64Url(String.fromCharCode(...new Uint8Array(sig)))
  return `${header}.${body}.${sigB64}`
}

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

describe('auth full verification flow', () => {
  let keyPair: CryptoKeyPair
  let publicJwk: JsonWebKey
  const now = () => Math.floor(Date.now() / 1000)

  function validClaims(overrides?: Record<string, unknown>) {
    return {
      sub: 'user_42',
      iss: 'https://vocal-longhorn-17.clerk.accounts.dev',
      aud: 'mame-api',
      exp: now() + 3600,
      nbf: now() - 30,
      iat: now() - 30,
      ...overrides,
    }
  }

  beforeAll(async () => {
    keyPair = await generateRsaKeyPair()
    publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    publicJwk.kid = 'test-kid'
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('verifies valid RS256 token and sets context', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({ metadata: { token_id: 'tok_abc', role: 'admin' } }),
      keyPair.privateKey,
    )

    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, string>
    expect(body.userId).toBe('user_42')
    expect(body.tokenId).toBe('tok_abc')
    expect(body.role).toBe('admin')
  })

  it('rejects expired RS256 token', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({
        sub: 'user_1',
        exp: 1000000000,
        nbf: 999999000,
        iat: 999999000,
      }),
      keyPair.privateKey,
    )

    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('expired')
  })

  it('rejects unsupported algorithm', async () => {
    const app = createTestApp()
    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = base64Url(JSON.stringify({ sub: 'u', exp: 9999999999 }))
    const fake = `${header}.${payload}.fakesig`

    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${fake}` },
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('algorithm')
  })

  it('rejects invalid issuer', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({ iss: 'https://evil-issuer.example.com' }),
      keyPair.privateKey,
    )

    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('issuer')
  })

  it('rejects invalid audience', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({ aud: 'other-api' }),
      keyPair.privateKey,
    )

    const res = await app.request('/p/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('audience')
  })

  it('rejects privileged role without MFA when enforcement is enabled', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({ metadata: { token_id: 'tok_abc', role: 'admin' } }),
      keyPair.privateKey,
    )

    const res = await app.request(
      '/p/me',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      {
        REQUIRE_MFA_FOR_PRIVILEGED: 'true',
      } as never,
    )

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('MFA required')
  })

  it('allows privileged role with MFA when enforcement is enabled', async () => {
    const app = createTestApp()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 }),
    )

    const token = await signJwt(
      validClaims({
        metadata: { token_id: 'tok_abc', role: 'admin' },
        amr: ['pwd', 'mfa'],
      }),
      keyPair.privateKey,
    )

    const res = await app.request(
      '/p/me',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      {
        REQUIRE_MFA_FOR_PRIVILEGED: 'true',
      } as never,
    )

    expect(res.status).toBe(200)
  })
})
