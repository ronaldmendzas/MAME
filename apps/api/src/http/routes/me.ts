import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { authMiddleware } from '../middleware/auth.js'

const me = new Hono<AppEnv>()

me.use('*', authMiddleware)

me.get('/', (c) => {
  return c.json({
    userId: c.get('userId'),
    tokenId: c.get('tokenId'),
    role: c.get('userRole'),
  })
})

export { me }
