import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import {
  DomainError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../../src/domain/errors'
import { errorHandler } from '../../src/http/middleware/error-handler'

function appWith(error: Error) {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/test', () => {
    throw error
  })
  return app
}

describe('errorHandler', () => {
  it('maps DomainError to correct status', async () => {
    const app = appWith(new DomainError('bad', 'BAD', 400))
    const res = await app.request('/test')
    expect(res.status).toBe(400)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toEqual({
      success: false,
      error: 'bad',
      code: 'BAD',
    })
  })

  it('maps NotFoundError to 404', async () => {
    const res = await appWith(new NotFoundError('Report')).request('/test')
    expect(res.status).toBe(404)
  })

  it('maps ForbiddenError to 403', async () => {
    const res = await appWith(new ForbiddenError()).request('/test')
    expect(res.status).toBe(403)
  })

  it('maps UnauthorizedError to 401', async () => {
    const res = await appWith(new UnauthorizedError()).request('/test')
    expect(res.status).toBe(401)
  })

  it('maps ValidationError to 422', async () => {
    const res = await appWith(new ValidationError('oops')).request('/test')
    expect(res.status).toBe(422)
  })

  it('returns 500 for unknown errors', async () => {
    const res = await appWith(new Error('crash')).request('/test')
    expect(res.status).toBe(500)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.code).toBe('INTERNAL')
    expect(body.error).toBe('Internal server error')
  })
})
