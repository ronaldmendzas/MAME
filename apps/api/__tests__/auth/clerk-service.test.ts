import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createClerkService } from '../../src/infrastructure/auth/clerk-service'

describe('createClerkService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls Clerk API with correct URL and headers', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const service = createClerkService('sk_test_key')
    await service.updateUserMetadata('user_123', 'token_abc')

    expect(spy).toHaveBeenCalledOnce()
    const [url, opts] = spy.mock.calls[0]!
    expect(url).toBe('https://api.clerk.com/v1/users/user_123/metadata')
    expect((opts as RequestInit).method).toBe('PATCH')
    const headers = (opts as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer sk_test_key')
  })

  it('sends token_id in public_metadata body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const service = createClerkService('sk_test')
    await service.updateUserMetadata('user_1', 'tok_xyz')

    const body = (vi.mocked(fetch).mock.calls[0]![1] as RequestInit).body
    const parsed = JSON.parse(body as string) as Record<string, unknown>
    expect(parsed).toEqual({
      public_metadata: { token_id: 'tok_xyz' },
    })
  })

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Forbidden', { status: 403 }))

    const service = createClerkService('sk_bad')
    await expect(service.updateUserMetadata('user_1', 'tok_1')).rejects.toThrow(
      'Clerk metadata update failed: 403',
    )
  })
})
