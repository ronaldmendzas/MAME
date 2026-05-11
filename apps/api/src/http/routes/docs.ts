import { Hono } from 'hono'

import type { AppEnv } from '../../env.js'
import { openApiSpec } from '../../openapi/index.js'

const docsRoutes = new Hono<AppEnv>()

docsRoutes.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=3600')
  return c.json(openApiSpec)
})

export { docsRoutes }
