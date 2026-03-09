import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'

import { handleMediaProxy } from './media-proxy.js'

const mediaRoutes = new Hono<AppEnv>()

mediaRoutes.get('/:fileKey', handleMediaProxy)

export { mediaRoutes }
