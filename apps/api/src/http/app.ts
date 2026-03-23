import { Hono } from 'hono'

import type { AppEnv } from '../env.js'

import { errorHandler } from './middleware/error-handler.js'
import { rateLimitRead } from './middleware/rate-limit.js'
import { createSecurityMiddleware } from './middleware/security.js'
import { health, me, mediaRoutes, moderationRoutes, reportRoutes, securityRoutes, webhooks } from './routes/index.js'

export function createApp() {
  const app = new Hono<AppEnv>()
  const security = createSecurityMiddleware()

  app.onError(errorHandler)

  app.use('*', security.cors)
  app.use('*', security.headers)
  app.use('*', rateLimitRead())

  app.route('/health', health)
  app.route('/webhooks', webhooks)
  app.route('/me', me)
  app.route('/reports', reportRoutes)
  app.route('/moderation', moderationRoutes)
  app.route('/media', mediaRoutes)
  app.route('/security', securityRoutes)

  app.notFound((c) => {
    return c.json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, 404)
  })

  return app
}
