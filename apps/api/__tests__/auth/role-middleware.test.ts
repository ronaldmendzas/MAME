import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { requireRole } from '../../src/http/middleware/role'

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

  app.use('/audit/*', async (c, next) => {
    c.set('userRole', 'auditor')
    await next()
  })
  app.get('/audit/queue', requireRole('auditor', 'moderator', 'admin'), (c) => c.json({ ok: true }))
  app.patch('/audit/report', requireRole('moderator', 'admin'), (c) => c.json({ ok: true }))

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

  it('allows auditor to access read-only moderation queue', async () => {
    const res = await app.request('/audit/queue')
    expect(res.status).toBe(200)
  })

  it('denies auditor from moderation write actions', async () => {
    const res = await app.request('/audit/report', { method: 'PATCH' })
    expect(res.status).toBe(403)
  })
})
