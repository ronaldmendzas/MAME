import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { AppEnv } from '../../src/env'
import { rateLimitRead, rateLimitWrite } from '../../src/http/middleware/rate-limit'

function createMockKV(): KVNamespace {
  const store = new Map<string, string>()
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value) },
    delete: async () => {},
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace
}

function createApp(middleware: ReturnType<typeof rateLimitRead>) {
  const app = new Hono<AppEnv>()
  const kv = createMockKV()

  app.use('*', async (c, next) => {
    c.env = { ...c.env, RATE_LIMIT_KV: kv } as AppEnv['Bindings']
    await next()
  })
  app.use('*', middleware)
  app.get('/test', (c) => c.json({ ok: true }))
  app.post('/test', (c) => c.json({ ok: true }))

  return app
}

describe('rateLimitRead', () => {
  it('allows requests within limit', async () => {
    const app = createApp(rateLimitRead())
    const res = await app.request('/test')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
  })

  it('includes rate limit headers', async () => {
    const app = createApp(rateLimitRead())
    const res = await app.request('/test')
    expect(res.headers.has('X-RateLimit-Remaining')).toBe(true)
    expect(res.headers.has('X-RateLimit-Reset')).toBe(true)
  })
})

describe('rateLimitWrite', () => {
  it('has lower limit than read', async () => {
    const app = createApp(rateLimitWrite())
    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('20')
  })

  it('blocks requests exceeding limit', async () => {
    const app = createApp(rateLimitWrite())
    for (let i = 0; i < 20; i++) {
      await app.request('/test', { method: 'POST' })
    }
    const res = await app.request('/test', { method: 'POST' })
    expect(res.status).toBe(429)
  })
})
