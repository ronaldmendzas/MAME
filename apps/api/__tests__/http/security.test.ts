import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { AppEnv } from '../../src/env'
import { createSecurityMiddleware } from '../../src/http/middleware/security'

function createTestApp(envOverride?: Partial<AppEnv['Bindings']>) {
  const app = new Hono<AppEnv>()
  const security = createSecurityMiddleware()

  app.use('*', async (c, next) => {
    if (envOverride) {
      const current = c.env ?? ({} as AppEnv['Bindings'])
      c.env = { ...current, ...envOverride } as AppEnv['Bindings']
    }
    await next()
  })
  app.use('*', security.cors)
  app.use('*', security.headers)
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

describe('security middleware CORS', () => {
  it('allows localhost:3000 by default', async () => {
    const app = createTestApp()
    const res = await app.request('/test', {
      headers: { Origin: 'http://localhost:3000' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
  })

  it('rejects unlisted origin', async () => {
    const app = createTestApp()
    const res = await app.request('/test', {
      headers: { Origin: 'https://evil.com' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('uses ALLOWED_ORIGINS env var when set', async () => {
    const app = createTestApp({
      ALLOWED_ORIGINS: 'https://mame.app, https://staging.mame.app',
    } as unknown as Partial<AppEnv['Bindings']>)

    const res = await app.request('/test', {
      headers: { Origin: 'https://mame.app' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('https://mame.app')
  })
})

describe('security middleware headers', () => {
  const app = createTestApp()

  it('sets CSP header', async () => {
    const res = await app.request('/test')
    const csp = res.headers.get('content-security-policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('sets Permissions-Policy header', async () => {
    const res = await app.request('/test')
    const pp = res.headers.get('permissions-policy')
    expect(pp).toContain('camera=()')
    expect(pp).toContain('microphone=()')
  })

  it('sets HSTS header', async () => {
    const res = await app.request('/test')
    const hsts = res.headers.get('strict-transport-security')
    expect(hsts).toContain('max-age=31536000')
  })

  it('sets X-Frame-Options DENY', async () => {
    const res = await app.request('/test')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('sets X-Content-Type-Options nosniff', async () => {
    const res = await app.request('/test')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('sets Referrer-Policy', async () => {
    const res = await app.request('/test')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('sets X-XSS-Protection to 0 (disables legacy auditor)', async () => {
    const res = await app.request('/test')
    expect(res.headers.get('x-xss-protection')).toBe('0')
  })

  it('includes api.clerk.dev in connect-src directive', async () => {
    const res = await app.request('/test')
    const csp = res.headers.get('content-security-policy')
    expect(csp).toContain('https://api.clerk.dev')
  })
})

describe('security middleware CORS credentials', () => {
  it('sets access-control-allow-credentials for allowed origin', async () => {
    const app = createTestApp()
    const res = await app.request('/test', {
      headers: { Origin: 'http://localhost:3000' },
    })
    expect(res.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('does not set credentials header for rejected origin', async () => {
    const app = createTestApp()
    const res = await app.request('/test', {
      headers: { Origin: 'https://evil.com' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('never allows wildcard origin regardless of environment', async () => {
    const app = createTestApp({ ENVIRONMENT: 'development' } as unknown as Partial<
      AppEnv['Bindings']
    >)
    const res = await app.request('/test', {
      headers: { Origin: 'https://attacker.com' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
