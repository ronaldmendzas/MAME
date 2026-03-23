import type { Context, Next } from 'hono'

import type { AppEnv } from '../../env.js'

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

const READ_LIMIT: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
const WRITE_LIMIT: RateLimitConfig = { maxRequests: 20, windowSeconds: 60 }

const fallback = new Map<string, { c: number; r: number }>()

export function rateLimitRead() {
  return (c: Context<AppEnv>, next: Next) =>
    applyRateLimit(c, next, READ_LIMIT)
}

export function rateLimitWrite() {
  return (c: Context<AppEnv>, next: Next) =>
    applyRateLimit(c, next, WRITE_LIMIT)
}

async function applyRateLimit(
  c: Context<AppEnv>,
  next: Next,
  config: RateLimitConfig,
): Promise<Response | void> {
  const ip = c.req.header('CF-Connecting-IP')
    ?? c.req.header('x-forwarded-for')
    ?? 'unknown'
  const key = `rl:${ip}:${config.maxRequests}`
  const kv = isUsableKv(c.env?.RATE_LIMIT_KV)

  const { count, resetAt } = kv
    ? await incrementKV(kv, key, config)
    : incrementMemory(key, config)

  c.header('X-RateLimit-Limit', String(config.maxRequests))
  c.header('X-RateLimit-Remaining', String(Math.max(0, config.maxRequests - count)))
  c.header('X-RateLimit-Reset', String(resetAt))

  if (count > config.maxRequests) {
    return c.json(
      { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
      429,
    )
  }

  await next()
}

function isUsableKv(kv: KVNamespace | undefined): KVNamespace | null {
  if (!kv) return null
  if (typeof kv.get !== 'function') return null
  if (typeof kv.put !== 'function') return null
  return kv
}

async function incrementKV(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig,
): Promise<{ count: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000)
  const raw = await kv.get(key)

  let count = 1
  let resetAt = now + config.windowSeconds

  if (raw) {
    const entry = JSON.parse(raw) as { c: number; r: number }
    if (now < entry.r) {
      count = entry.c + 1
      resetAt = entry.r
    }
  }

  const ttl = resetAt - now
  await kv.put(key, JSON.stringify({ c: count, r: resetAt }), {
    expirationTtl: Math.max(ttl, 60),
  })

  return { count, resetAt }
}

function incrementMemory(
  key: string,
  config: RateLimitConfig,
): { count: number; resetAt: number } {
  const now = Math.floor(Date.now() / 1000)
  let entry = fallback.get(key)

  if (!entry || now >= entry.r) {
    entry = { c: 0, r: now + config.windowSeconds }
    fallback.set(key, entry)
  }

  entry.c++
  return { count: entry.c, resetAt: entry.r }
}
