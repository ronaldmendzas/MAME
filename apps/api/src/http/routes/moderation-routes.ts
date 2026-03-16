import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimitWrite } from '../middleware/rate-limit.js'
import { requireRole } from '../middleware/role.js'

import { handleModerate } from './moderation.js'
import { handleModerationQueue } from './moderation-queue.js'
import { handleModerateReport } from './moderation-action.js'

const moderationRoutes = new Hono<AppEnv>()

moderationRoutes.post('/check', authMiddleware, rateLimitWrite(), handleModerate)
moderationRoutes.get('/queue', authMiddleware, requireRole('moderator', 'admin'), handleModerationQueue)
moderationRoutes.patch('/:id', authMiddleware, requireRole('moderator', 'admin'), rateLimitWrite(), handleModerateReport)

export { moderationRoutes }
