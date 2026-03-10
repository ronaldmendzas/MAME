import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/http/app'
import { signMediaUrl } from '../../src/domain/media-signature'

const MASTER_KEY = 'a'.repeat(64)

function makeEnv(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://test',
    ENCRYPTION_MASTER_KEY: MASTER_KEY,
    ENCRYPTION_RELATION_KEY: 'b'.repeat(64),
    ENVIRONMENT: 'test',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    CLERK_SECRET_KEY: 'sk_test_123',
    CLERK_WEBHOOK_SECRET: 'whsec_test',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: '123',
    CLOUDINARY_API_SECRET: 'secret',
    RESEND_API_KEY: 'test',
    SENTRY_DSN: '',
    RATE_LIMIT_KV: {},
    AI: { run: async () => ({ response: { safe: true } }) },
    ...overrides,
  }
}

describe('media proxy route', () => {
  it('rejects request without signature params', async () => {
    const app = createApp()
    const res = await app.request('/media/some-key', {}, makeEnv())
    expect(res.status).toBe(422)
  })

  it('rejects expired signature', async () => {
    const app = createApp()
    const url = await signMediaUrl(
      'http://localhost', 'some-key', MASTER_KEY, -1,
    )
    const path = url.replace('http://localhost', '')
    const res = await app.request(path, {}, makeEnv())
    expect(res.status).toBe(422)
  })

  it('rejects tampered signature', async () => {
    const app = createApp()
    const url = await signMediaUrl(
      'http://localhost', 'some-key', MASTER_KEY,
    )
    const path = url.replace('http://localhost', '').replace(/sig=[^&]+/, 'sig=tampered')
    const res = await app.request(path, {}, makeEnv())
    expect(res.status).toBe(422)
  })
})
