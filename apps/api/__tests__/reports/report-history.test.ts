import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { errorHandler } from '../../src/http/middleware/error-handler'
import { handleStatusHistory } from '../../src/http/routes/report-history'

function createTestApp() {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/:id/history', handleStatusHistory as never)
  return app
}

describe('GET /reports/:id/history', () => {
  const app = createTestApp()

  it('rejects invalid UUID', async () => {
    const res = await app.request('/not-a-uuid/history')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('accepts valid UUID format', async () => {
    const uuid = '00000000-0000-0000-0000-000000000001'
    const res = await app.request(`/${uuid}/history`)
    expect([200, 500]).toContain(res.status)
  })
})
