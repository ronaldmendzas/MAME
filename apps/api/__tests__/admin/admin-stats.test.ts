import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { adminRoutes } from '../../src/http/routes/admin-routes'

const getAdminStatsMock = vi.hoisted(() => vi.fn())

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
  createDb: () => ({}),
}))

vi.mock('../../src/infrastructure/db/stats-repository.js', () => ({
  getAdminStats: getAdminStatsMock,
}))

vi.mock('../../src/infrastructure/db/user-repository.js', () => ({
  createUserRepository: () => ({
    listUsers: vi.fn().mockResolvedValue([]),
    updateRole: vi.fn().mockResolvedValue({ id: 'u1', role: 'moderator' }),
  }),
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

describe('admin stats route', () => {
  const app = createTestApp()

  beforeEach(() => {
    vi.clearAllMocks()
    getAdminStatsMock.mockResolvedValue({
      reportsByCategory: [{ category: 'fraud', count: 5 }],
      reportsByMonth: [{ month: '2026-05', count: 3 }],
      reportsByFaculty: [{ faculty: 'Engineering', count: 4 }],
      reportsByStatus: [{ status: 'published', count: 2 }],
      averageModerationTimeMinutes: 120,
      totalReports: 10,
      totalVotes: 25,
      totalComments: 40,
      activeTokens: 8,
      suspendedTokens: 1,
    })
  })

  it('returns stats for admin', async () => {
    const res = await app.request('/admin/stats', { headers: { 'x-role': 'admin' } }, makeEnv())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; data: { totalReports: number } }
    expect(body.success).toBe(true)
    expect(body.data.totalReports).toBe(10)
    expect(body.data.totalVotes).toBe(25)
    expect(body.data.totalComments).toBe(40)
    expect(body.data.activeTokens).toBe(8)
    expect(body.data.suspendedTokens).toBe(1)
    expect(body.data.averageModerationTimeMinutes).toBe(120)
  })

  it('rejects non-admin roles', async () => {
    const res = await app.request('/admin/stats', { headers: { 'x-role': 'moderator' } }, makeEnv())
    expect(res.status).toBe(403)
    expect(getAdminStatsMock).not.toHaveBeenCalled()
  })
})
