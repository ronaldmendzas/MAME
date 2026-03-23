import type { NextConfig } from 'next'

const isDevelopment = process.env['NODE_ENV'] !== 'production'
const apiOrigin = getApiOrigin(process.env['NEXT_PUBLIC_API_URL'])

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  'https://vocal-longhorn-17.clerk.accounts.dev',
].join(' ')

const connectSrc = [
  "'self'",
  'https://vocal-longhorn-17.clerk.accounts.dev',
  'https://api.clerk.dev',
  ...(apiOrigin ? [apiOrigin] : []),
].join(' ')

const cspDirectives = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://img.clerk.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-src https://vocal-longhorn-17.clerk.accounts.dev",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  transpilePackages: ['@mame/shared'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

function getApiOrigin(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

export default nextConfig
