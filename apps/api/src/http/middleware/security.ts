import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

export function createSecurityMiddleware() {
  return {
    cors: cors({
      origin: ['http://localhost:3000'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
    headers: secureHeaders({
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    }),
  }
}
