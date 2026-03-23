import { beforeEach, describe, expect, it, vi } from 'vitest'

const { insertMock, createDbMock, createRepoMock } = vi.hoisted(() => {
  const insertMock = vi.fn()
  const createDbMock = vi.fn(() => ({}))
  const createRepoMock = vi.fn(() => ({ insert: insertMock }))
  return { insertMock, createDbMock, createRepoMock }
})

vi.mock('../../src/infrastructure/db/connection', () => ({
  createDb: createDbMock,
}))

vi.mock('../../src/infrastructure/db/security-event-repository', () => ({
  createSecurityEventRepository: createRepoMock,
}))

import { recordSecurityEvent } from '../../src/application/security-events'

describe('recordSecurityEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when DATABASE_URL is missing', async () => {
    await recordSecurityEvent(undefined, {
      eventType: 'auth_failure',
      outcome: 'denied',
      source: 'auth_middleware',
    })

    expect(createDbMock).not.toHaveBeenCalled()
    expect(createRepoMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('writes event when DATABASE_URL exists', async () => {
    await recordSecurityEvent(
      {
        DATABASE_URL: 'postgresql://example',
      } as never,
      {
        eventType: 'auth_success',
        outcome: 'allowed',
        source: 'auth_middleware',
        details: { method: 'GET' },
      },
    )

    expect(createDbMock).toHaveBeenCalledWith('postgresql://example')
    expect(createRepoMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledWith({
      eventType: 'auth_success',
      outcome: 'allowed',
      source: 'auth_middleware',
      details: { method: 'GET' },
    })
  })

  it('swallows repository errors to keep request flow safe', async () => {
    insertMock.mockRejectedValueOnce(new Error('db down'))

    await expect(
      recordSecurityEvent(
        {
          DATABASE_URL: 'postgresql://example',
        } as never,
        {
          eventType: 'access_denied',
          outcome: 'denied',
          source: 'role_middleware',
        },
      ),
    ).resolves.toBeUndefined()
  })
})
