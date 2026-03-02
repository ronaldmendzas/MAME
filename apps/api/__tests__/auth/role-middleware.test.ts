import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'

import type { AppEnv } from '../../src/env'
import { requireRole } from '../../src/http/middleware/role'
import { errorHandler } from '../../src/http/middleware/error-handler'

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)

  app.use('/admin/*', async (c, next) => {
    c.set('userRole', 'user')
    await next()
  })
  app.use('/admin/*', requireRole('admin'))
  app.get('/admin/dashboard', (c) => c.json({ ok: true }))

  app.use('/mod/*', async (c, next) => {
    c.set('userRole', 'moderator')
    await next()
  })
  app.use('/mod/*', requireRole('moderator', 'admin'))
  app.get('/mod/queue', (c) => c.json({ ok: true }))

  return app
}

describe('requireRole middleware', () => {
  const app = createTestApp()

  it('returns 403 when user role does not match', async () => {
    const res = await app.request('/admin/dashboard')
    expect(res.status).toBe(403)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('admin')
  })

  it('allows moderator to access mod routes', async () => {
    const res = await app.request('/mod/queue')
    expect(res.status).toBe(200)
  })
})
