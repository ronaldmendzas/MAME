import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import type { AppEnv } from '../../env.js'

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]

export function createSecurityMiddleware() {
  const corsMiddleware: MiddlewareHandler<AppEnv> = (c, next) => {
    const raw = c.env?.ALLOWED_ORIGINS
    const isDevelopment = c.env?.ENVIRONMENT === 'development'
    const origins = raw
      ? raw.split(',').map((o) => o.trim())
      : DEV_ORIGINS
    const allowedOrigins = new Set(origins)

    return cors({
      origin: isDevelopment
        ? '*'
        : (requestOrigin) => {
            if (allowedOrigins.has(requestOrigin)) return requestOrigin
            return ''
          },
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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
