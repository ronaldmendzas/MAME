import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/role.js'

import { handleSecurityEvents } from './security-events.js'

const securityRoutes = new Hono<AppEnv>()

securityRoutes.get('/events', authMiddleware, requireRole('auditor', 'admin'), handleSecurityEvents)

export { securityRoutes }
