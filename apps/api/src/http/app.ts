import { Hono } from 'hono'

import type { Env } from '../env.js'

import { errorHandler } from './middleware/error-handler.js'
import { createSecurityMiddleware } from './middleware/security.js'
import { health } from './routes/index.js'

export function createApp() {
  const app = new Hono<{ Bindings: Env }>()
  const security = createSecurityMiddleware()

  app.use('*', security.cors)
  app.use('*', security.headers)
  app.use('*', errorHandler)

  app.route('/health', health)

  app.notFound((c) => {
    return c.json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, 404)
  })

  return app
}
