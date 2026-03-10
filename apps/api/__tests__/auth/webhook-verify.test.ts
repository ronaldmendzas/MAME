import { describe, expect, it } from 'vitest'

import { verifyClerkWebhook } from '../../src/infrastructure/auth/webhook-verify'

describe('verifyClerkWebhook', () => {
  it('throws on invalid signature', () => {
    expect(() =>
      verifyClerkWebhook(
        '{"type":"user.created","data":{}}',
        {
          'svix-id': 'msg_fake',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,invalid',
        },
        'whsec_test_secret_that_is_long_enough',
      ),
    ).toThrow()
  })

  it('throws on empty payload', () => {
    expect(() =>
      verifyClerkWebhook(
        '',
        {
          'svix-id': '',
          'svix-timestamp': '',
          'svix-signature': '',
        },
        'whsec_test',
      ),
    ).toThrow()
  })

  it('throws on missing headers', () => {
    expect(() =>
      verifyClerkWebhook(
        '{}',
        {} as Record<string, string>,
        'whsec_test',
      ),
    ).toThrow()
  })
})
