import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { adminRoutes } from '../../src/http/routes/admin-routes'

const { listUsersMock, updateRoleMock, createDbMock, createUserRepoMock } = vi.hoisted(() => {
  const listUsersMock = vi.fn()
  const updateRoleMock = vi.fn()
  const createDbMock = vi.fn(() => ({}))
  const createUserRepoMock = vi.fn(() => ({ listUsers: listUsersMock, updateRole: updateRoleMock }))
  return { listUsersMock, updateRoleMock, createDbMock, createUserRepoMock }
})

vi.mock('../../src/http/middleware/auth.js', () => ({
  authMiddleware: async (
    c: {
      req: { header: (name: string) => string | undefined }
      set: (key: string, value: string) => void
    },
    next: () => Promise<void>,
  ) => {
    const role = c.req.header('x-role') ?? 'user'
    c.set('userRole', role)
    c.set('tokenId', 'tok_admin')
    await next()
  },
}))

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: createDbMock,
}))

vi.mock('../../src/infrastructure/db/user-repository.js', () => ({
  createUserRepository: createUserRepoMock,
}))

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.route('/admin', adminRoutes)
  return app
}

function makeEnv() {
  return { DATABASE_URL: 'postgresql://example' } as AppEnv['Bindings']
}

describe('admin routes', () => {
  const app = createTestApp()

  beforeEach(() => {
    vi.clearAllMocks()
    listUsersMock.mockResolvedValue([
      {
        id: 'u_1',
        clerkId: 'clerk_1',
        emailHash: 'hash_1',
        role: 'user',
        createdAt: new Date('2026-03-20T00:00:00Z'),
      },
    ])
    updateRoleMock.mockResolvedValue({
      id: 'u_1',
      clerkId: 'clerk_1',
      emailHash: 'hash_1',
      role: 'moderator',
      createdAt: new Date('2026-03-20T00:00:00Z'),
    })
  })

  it('allows admin to list users', async () => {
    const res = await app.request(
      '/admin/users?limit=25',
      { headers: { 'x-role': 'admin' } },
      makeEnv(),
    )

    expect(res.status).toBe(200)
    expect(listUsersMock).toHaveBeenCalledWith(25)
    const body = (await res.json()) as {
      success: boolean
      meta: { limit: number; count: number }
      data: Array<{ id: string }>
    }
    expect(body.success).toBe(true)
    expect(body.meta.limit).toBe(25)
    expect(body.meta.count).toBe(1)
    expect(body.data[0]?.id).toBe('u_1')
  })

  it('rejects non-admin roles', async () => {
    const res = await app.request('/admin/users', { headers: { 'x-role': 'moderator' } }, makeEnv())
    expect(res.status).toBe(403)
    expect(listUsersMock).not.toHaveBeenCalled()
  })

  it('allows admin to update role', async () => {
    const res = await app.request(
      '/admin/users/u_1/role',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify({ role: 'moderator' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(200)
    expect(updateRoleMock).toHaveBeenCalledWith('u_1', 'moderator')
  })

  it('returns 422 on invalid role payload', async () => {
    const res = await app.request(
      '/admin/users/u_1/role',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify({ role: 'owner' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(422)
  })
})
