import type { Context } from 'hono'

import { verifyMediaSignature } from '../../domain/media-signature.js'
import { NotFoundError, ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'

export async function handleMediaProxy(c: Context<AppEnv>) {
  const fileKey = decodeURIComponent(c.req.param('fileKey') ?? '')
  if (!fileKey) throw new ValidationError('Missing file key')

  const { expires, sig } = c.req.query()
  if (!expires || !sig) throw new ValidationError('Missing signature')

  const secret = c.env.ENCRYPTION_MASTER_KEY
  const valid = await verifyMediaSignature(fileKey, expires, sig, secret)
  if (!valid) throw new ValidationError('Invalid or expired signature')

  const cloudName = c.env.CLOUDINARY_CLOUD_NAME
  const origin = buildOriginUrl(cloudName, fileKey)

  const cached = await matchCache(c.req.url)
  if (cached) return cached

  const upstream = await fetch(origin)
  if (!upstream.ok) throw new NotFoundError('Media not found')

  const response = buildCachedResponse(upstream)
  cacheInBackground(c, c.req.url, response.clone())

  return response
}

function buildOriginUrl(cloud: string, key: string): string {
  return `https://res.cloudinary.com/${cloud}/image/upload/${key}`
}

async function matchCache(url: string): Promise<Response | undefined> {
  const cache = caches.default
  const match = await cache.match(url)
  return match ?? undefined
}

function buildCachedResponse(upstream: Response): Response {
  const headers = new Headers(upstream.headers)
  headers.set('Cache-Control', 'public, max-age=86400')
  headers.set('CDN-Cache-Control', 'public, max-age=604800')
  headers.delete('Set-Cookie')

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}

function cacheInBackground(c: Context, url: string, response: Response) {
  c.executionCtx.waitUntil(caches.default.put(url, response))
}
