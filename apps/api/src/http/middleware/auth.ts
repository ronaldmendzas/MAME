import type { Context, Next } from 'hono'

import type { AppEnv } from '../../env.js'
import { UnauthorizedError } from '../../domain/errors.js'

const CLERK_JWKS_URL = 'https://vocal-longhorn-17.clerk.accounts.dev/.well-known/jwks.json'

let cachedKey: CryptoKey | null = null

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  const payload = await verifyJwt(token)

  c.set('userId', payload.sub as string)
  c.set('tokenId', (payload.metadata as TokenMetadata)?.token_id ?? '')
  c.set('userRole', (payload.metadata as TokenMetadata)?.role ?? 'user')

  await next()
}

interface TokenMetadata {
  token_id?: string
  role?: string
}

interface JwtPayload {
  sub: string
  exp: number
  iat: number
  metadata?: TokenMetadata
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new UnauthorizedError('Malformed JWT')

  const header = JSON.parse(atob(parts[0]!)) as { alg: string; kid?: string }
  if (header.alg !== 'RS256') throw new UnauthorizedError('Unsupported algorithm')

  const key = await getVerificationKey(header.kid)
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const signature = base64UrlToArrayBuffer(parts[2]!)

  const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
  if (!isValid) throw new UnauthorizedError('Invalid JWT signature')

  const payload = JSON.parse(atob(parts[1]!)) as JwtPayload
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) throw new UnauthorizedError('JWT expired')

  return payload
}

async function getVerificationKey(kid?: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey

  const response = await fetch(CLERK_JWKS_URL)
  if (!response.ok) throw new UnauthorizedError('Failed to fetch JWKS')

  const jwks = (await response.json()) as { keys: (JsonWebKey & { kid?: string })[] }
  const jwk = kid
    ? jwks.keys.find((k) => k.kid === kid)
    : jwks.keys[0]

  if (!jwk) throw new UnauthorizedError('No matching key found')

  cachedKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  return cachedKey
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}
