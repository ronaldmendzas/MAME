import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/http/app.js'

describe('Hono App', () => {
  const app = createApp()

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.status).toBe('ok')
      expect(body.version).toBe('0.0.1')
      expect(body.timestamp).toBeDefined()
    })

    it('returns valid ISO timestamp', async () => {
      const res = await app.request('/health')
      const body = await res.json()
      const date = new Date(body.timestamp)
      expect(date.toISOString()).toBe(body.timestamp)
    })
  })

  describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.code).toBe('NOT_FOUND')
    })

    it('returns 404 for POST to health', async () => {
      const res = await app.request('/health', { method: 'POST' })
      expect(res.status).toBe(404)
    })
  })

  describe('CORS headers', () => {
    it('includes CORS headers for allowed origin', async () => {
      const res = await app.request('/health', {
        headers: { Origin: 'http://localhost:3000' },
      })

      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
    })

    it('handles preflight OPTIONS request', async () => {
      const res = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      })

      expect(res.status).toBe(204)
    })
  })

  describe('security headers', () => {
    it('includes X-Frame-Options DENY', async () => {
      const res = await app.request('/health')
      expect(res.headers.get('x-frame-options')).toBe('DENY')
    })

    it('includes X-Content-Type-Options nosniff', async () => {
      const res = await app.request('/health')
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    })

    it('includes Content-Security-Policy', async () => {
      const res = await app.request('/health')
      const csp = res.headers.get('content-security-policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('includes Permissions-Policy', async () => {
      const res = await app.request('/health')
      const pp = res.headers.get('permissions-policy')
      expect(pp).toContain('camera=()')
      expect(pp).toContain('microphone=()')
      expect(pp).toContain('geolocation=()')
    })

    it('includes Strict-Transport-Security', async () => {
      const res = await app.request('/health')
      const hsts = res.headers.get('strict-transport-security')
      expect(hsts).toContain('max-age=31536000')
    })

    it('includes Referrer-Policy', async () => {
      const res = await app.request('/health')
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    })
  })
})
