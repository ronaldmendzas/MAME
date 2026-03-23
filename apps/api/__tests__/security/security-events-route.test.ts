import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { securityRoutes } from '../../src/http/routes/security-routes'

const { findRecentMock, createDbMock, createRepoMock } = vi.hoisted(() => {
  const findRecentMock = vi.fn()
  const createDbMock = vi.fn(() => ({}))
  const createRepoMock = vi.fn(() => ({ findRecent: findRecentMock }))
  return { findRecentMock, createDbMock, createRepoMock }
})

vi.mock('../../src/http/middleware/auth.js', () => ({
  authMiddleware: async (c: { req: { header: (name: string) => string | undefined }; set: (key: string, value: string) => void }, next: () => Promise<void>) => {
    const role = c.req.header('x-role') ?? 'user'
    c.set('userRole', role)
    c.set('tokenId', 'tok_test')
    await next()
  },
}))

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: createDbMock,
}))

vi.mock('../../src/infrastructure/db/security-event-repository.js', () => ({
  createSecurityEventRepository: createRepoMock,
}))

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.route('/security', securityRoutes)
  return app
}

function makeEnv() {
  return { DATABASE_URL: 'postgresql://example' } as AppEnv['Bindings']
}

describe('security events route', () => {
  const app = createTestApp()

  beforeEach(() => {
    vi.clearAllMocks()
    findRecentMock.mockResolvedValue([
      {
        id: 'evt_1',
        eventType: 'auth_success',
        outcome: 'allowed',
        actorToken: 'tok_test',
        actorRole: 'auditor',
        source: 'auth_middleware',
        target: '/security/events',
        details: {},
        createdAt: new Date('2026-03-22T00:00:00Z'),
      },
    ])
  })

  it('allows auditor to read security events', async () => {
    const res = await app.request('/security/events?limit=25', {
      headers: { 'x-role': 'auditor' },
    }, makeEnv())

    expect(res.status).toBe(200)
    expect(createDbMock).toHaveBeenCalledTimes(1)
    expect(createRepoMock).toHaveBeenCalledTimes(1)
    expect(findRecentMock).toHaveBeenCalledWith(25)

    const body = (await res.json()) as {
      success: boolean
      meta: { limit: number; count: number }
      data: Array<{ id: string }>
    }
    expect(body.success).toBe(true)
    expect(body.meta.limit).toBe(25)
    expect(body.meta.count).toBe(1)
    expect(body.data[0]?.id).toBe('evt_1')
  })

  it('allows admin and clamps limit', async () => {
    const res = await app.request('/security/events?limit=999', {
      headers: { 'x-role': 'admin' },
    }, makeEnv())

    expect(res.status).toBe(200)
    expect(findRecentMock).toHaveBeenCalledWith(200)
  })

  it('rejects user role with 403', async () => {
    const res = await app.request('/security/events', {
      headers: { 'x-role': 'user' },
    }, makeEnv())

    expect(res.status).toBe(403)
    expect(findRecentMock).not.toHaveBeenCalled()
  })
})
