import type { Context, Next } from 'hono'

import type { AppEnv } from '../../env.js'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const READ_LIMIT: RateLimitConfig = { maxRequests: 100, windowMs: 60_000 }
const WRITE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 }

const counters = new Map<string, { count: number; resetAt: number }>()

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
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('x-forwarded-for') ?? 'unknown'
  const key = `${ip}:${config.maxRequests}`
  const now = Date.now()

  let entry = counters.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    counters.set(key, entry)
  }

  entry.count++

  c.header('X-RateLimit-Limit', String(config.maxRequests))
  c.header('X-RateLimit-Remaining', String(Math.max(0, config.maxRequests - entry.count)))
  c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

  if (entry.count > config.maxRequests) {
    return c.json(
      { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
      429,
    )
  }

  await next()
}
