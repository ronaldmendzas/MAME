import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'

import type { AppEnv } from '../../src/env'
import { rateLimitRead, rateLimitWrite } from '../../src/http/middleware/rate-limit'

describe('rateLimitRead', () => {
  it('allows requests within limit', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', rateLimitRead())
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
  })

  it('includes rate limit headers', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', rateLimitRead())
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test')
    expect(res.headers.has('X-RateLimit-Remaining')).toBe(true)
    expect(res.headers.has('X-RateLimit-Reset')).toBe(true)
  })
})

describe('rateLimitWrite', () => {
  it('has lower limit than read', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', rateLimitWrite())
    app.post('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('20')
  })
})
