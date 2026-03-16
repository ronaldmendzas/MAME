import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'
import { ensureRegisteredMiddleware } from '../middleware/ensure-registered.js'

const me = new Hono<AppEnv>()

me.use('*', authMiddleware)
me.use('*', ensureRegisteredMiddleware)

me.get('/', (c) => {
  return c.json({
    userId: c.get('userId'),
    tokenId: c.get('tokenId'),
    role: c.get('userRole'),
  })
})

export { me }
