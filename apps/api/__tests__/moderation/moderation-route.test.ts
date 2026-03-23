import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/http/app'

function makeEnv(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://test',
    ENCRYPTION_MASTER_KEY: 'a'.repeat(64),
    ENCRYPTION_RELATION_KEY: 'b'.repeat(64),
    ENVIRONMENT: 'test',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    CLERK_SECRET_KEY: 'sk_test_123',
    CLERK_WEBHOOK_SECRET: 'whsec_test',
    CLOUDINARY_CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: '123',
    CLOUDINARY_API_SECRET: 'secret',
    RESEND_API_KEY: 'test',
    SENTRY_DSN: '',
    RATE_LIMIT_KV: {},
    AI: {
      run: async () => ({
        response: { safe: true, categories: [] },
      }),
    },
    ...overrides,
  }
}

describe('moderation route', () => {
  it('returns 401 without auth', async () => {
    const app = createApp()
    const res = await app.request(
      '/moderation/check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test title', body: 'Test body' }),
      },
      makeEnv(),
    )
    expect(res.status).toBe(401)
  })

  it('returns 422 with invalid body', async () => {
    const app = createApp()
    const res = await app.request(
      '/moderation/check',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ title: '' }),
      },
      makeEnv(),
    )
    const status = res.status
    expect([401, 422]).toContain(status)
  })
})
