import type { Context, Next } from 'hono'

import type { AppEnv } from '../../env.js'
import { verifyJwt, type TokenMetadata } from './auth.js'

export async function optionalAuthMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    c.set('userId', '')
    c.set('tokenId', '')
    c.set('userRole', '')
    return next()
  }

  try {
    const token = authHeader.slice(7)
    const payload = await verifyJwt(token)
    c.set('userId', payload.sub as string)
    c.set('tokenId', (payload.metadata as TokenMetadata)?.token_id ?? '')
    c.set('userRole', (payload.metadata as TokenMetadata)?.role ?? 'user')
  } catch {
    c.set('userId', '')
    c.set('tokenId', '')
    c.set('userRole', '')
  }

  await next()
}
