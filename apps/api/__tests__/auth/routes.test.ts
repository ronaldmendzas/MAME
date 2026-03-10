import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/http/app'

describe('Webhook route', () => {
  const app = createApp()

  it('rejects requests without svix headers', async () => {
    const res = await app.request('/webhooks/clerk', {
      method: 'POST',
      body: JSON.stringify({ type: 'user.created', data: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 for GET on webhook endpoint', async () => {
    const res = await app.request('/webhooks/clerk')
    expect(res.status).toBe(404)
  })
})

describe('Health route still works', () => {
  const app = createApp()

  it('returns status ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string }
    expect(body.status).toBe('ok')
  })
})

describe('Protected /me route', () => {
  const app = createApp()

  it('returns 401 without auth', async () => {
    const res = await app.request('/me')
    expect(res.status).toBe(401)
  })
})
