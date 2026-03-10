import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import type { AppEnv } from '../../env.js'

const DEV_ORIGINS = ['http://localhost:3000']

export function createSecurityMiddleware() {
  const corsMiddleware: MiddlewareHandler<AppEnv> = (c, next) => {
    const raw = c.env?.ALLOWED_ORIGINS
    const origins = raw
      ? raw.split(',').map((o) => o.trim())
      : DEV_ORIGINS

    return cors({
      origin: origins,
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })(c, next)
  }

  return {
    cors: corsMiddleware,
    headers: secureHeaders({
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'blob:', 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    }),
  }
}
