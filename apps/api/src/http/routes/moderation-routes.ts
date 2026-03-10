import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimitWrite } from '../middleware/rate-limit.js'

import { handleModerate } from './moderation.js'

const moderationRoutes = new Hono<AppEnv>()

moderationRoutes.post('/', authMiddleware, rateLimitWrite(), handleModerate)

export { moderationRoutes }
