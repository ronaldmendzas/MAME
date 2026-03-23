import type { Context, Next } from 'hono'

import { recordSecurityEvent } from '../../application/security-events.js'
import { UnauthorizedError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { base64UrlToArrayBuffer } from './jwt-utils.js'

const CLERK_JWKS_URL = 'https://vocal-longhorn-17.clerk.accounts.dev/.well-known/jwks.json'
const DEFAULT_ISSUER = 'https://vocal-longhorn-17.clerk.accounts.dev'
const DEFAULT_AUDIENCE = 'mame-api'
const CLOCK_SKEW_SECONDS = 60
const JWKS_CACHE_TTL_SECONDS = 300

const keyCache = new Map<string, { key: CryptoKey; expiresAt: number }>()

export interface TokenMetadata {
  token_id?: string
  role?: string
}

export interface JwtPayload {
  sub: string
  iss: string
  aud: string | string[]
  exp: number
  nbf: number
  iat: number
  amr?: string[]
  acr?: string
  metadata?: TokenMetadata
}

interface VerifyOptions {
  expectedIssuer?: string
  expectedAudience?: string
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    void recordSecurityEvent(c.env, {
      eventType: 'auth_failure',
      outcome: 'denied',
      source: 'auth_middleware',
      target: c.req.path,
      details: { method: c.req.method, reason: 'missing_or_invalid_authorization_header' },
    })
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  let payload: JwtPayload
  try {
    payload = await verifyJwt(token, {
      expectedIssuer: c.env?.CLERK_JWT_ISSUER,
      expectedAudience: c.env?.CLERK_JWT_AUDIENCE,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'jwt_verification_failed'
    void recordSecurityEvent(c.env, {
      eventType: 'auth_failure',
      outcome: 'denied',
      source: 'auth_middleware',
      target: c.req.path,
      details: { method: c.req.method, reason },
    })
    throw error
  }

  c.set('userId', payload.sub as string)
  const tokenId = (payload.metadata as TokenMetadata)?.token_id ?? ''
  const role = (payload.metadata as TokenMetadata)?.role ?? 'user'

  const enforcePrivilegedMfa = c.env?.REQUIRE_MFA_FOR_PRIVILEGED === 'true'
  if (enforcePrivilegedMfa && isPrivilegedRole(role) && !hasMfaClaim(payload)) {
    void recordSecurityEvent(c.env, {
      eventType: 'access_denied',
      outcome: 'denied',
      source: 'auth_middleware',
      target: c.req.path,
      actorToken: tokenId || null,
      actorRole: role,
      details: {
        method: c.req.method,
        reason: 'mfa_required_for_privileged_role',
      },
    })
    throw new UnauthorizedError('MFA required for privileged role')
  }

  c.set('tokenId', tokenId)
  c.set('userRole', role)

  void recordSecurityEvent(c.env, {
    eventType: 'auth_success',
    outcome: 'allowed',
    source: 'auth_middleware',
    target: c.req.path,
    actorToken: tokenId || null,
    actorRole: role,
    details: { method: c.req.method },
  })

  await next()
}

function isPrivilegedRole(role: string): boolean {
  return role === 'admin' || role === 'moderator' || role === 'auditor'
}

function hasMfaClaim(payload: JwtPayload): boolean {
  const amr = payload.amr
  if (Array.isArray(amr) && amr.some((value) => value.toLowerCase().includes('mfa'))) {
    return true
  }

  if (typeof payload.acr === 'string' && payload.acr.toLowerCase().includes('mfa')) {
    return true
  }

  return false
}

export async function verifyJwt(token: string, options?: VerifyOptions): Promise<JwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new UnauthorizedError('Malformed JWT')

  const header = decodePart<{ alg: string; kid?: string }>(parts[0]!)
  if (header.alg !== 'RS256') throw new UnauthorizedError('Unsupported algorithm')
  if (!header.kid) throw new UnauthorizedError('Missing JWT kid')

  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const signature = base64UrlToArrayBuffer(parts[2]!)
  const key = await getVerificationKey(header.kid)

  let isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
  if (!isValid) {
    const refreshed = await getVerificationKey(header.kid, true)
    isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', refreshed, signature, data)
  }

  if (!isValid) throw new UnauthorizedError('Invalid JWT signature')

  const payload = decodePart<JwtPayload>(parts[1]!)
  validateClaims(payload, {
    expectedIssuer: options?.expectedIssuer ?? DEFAULT_ISSUER,
    expectedAudience: options?.expectedAudience ?? DEFAULT_AUDIENCE,
  })

  return payload
}

function decodePart<T>(value: string): T {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(base64 + padding)) as T
  } catch {
    throw new UnauthorizedError('Malformed JWT payload')
  }
}

function validateClaims(payload: JwtPayload, options: Required<VerifyOptions>) {
  const now = Math.floor(Date.now() / 1000)

  if (!payload.sub || !payload.iss || payload.aud === undefined) {
    throw new UnauthorizedError('Missing required JWT claims')
  }
  if (typeof payload.exp !== 'number' || typeof payload.nbf !== 'number' || typeof payload.iat !== 'number') {
    throw new UnauthorizedError('Invalid JWT time claims')
  }

  if (payload.iss !== options.expectedIssuer) {
    throw new UnauthorizedError('Invalid JWT issuer')
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audiences.includes(options.expectedAudience)) {
    throw new UnauthorizedError('Invalid JWT audience')
  }

  if (payload.nbf > now + CLOCK_SKEW_SECONDS) {
    throw new UnauthorizedError('JWT not active yet')
  }
  if (payload.iat > now + CLOCK_SKEW_SECONDS) {
    throw new UnauthorizedError('JWT issued in the future')
  }
  if (payload.exp <= now - CLOCK_SKEW_SECONDS) {
    throw new UnauthorizedError('JWT expired')
  }
}

async function getVerificationKey(kid: string, forceRefresh = false): Promise<CryptoKey> {
  const now = Math.floor(Date.now() / 1000)
  const cached = keyCache.get(kid)
  if (!forceRefresh && cached && cached.expiresAt > now) return cached.key

  const response = await fetch(CLERK_JWKS_URL)
  if (!response.ok) throw new UnauthorizedError('Failed to fetch JWKS')

  const jwks = (await response.json()) as { keys: (JsonWebKey & { kid?: string })[] }
  const jwk = jwks.keys.find((k) => k.kid === kid)

  if (!jwk) throw new UnauthorizedError('No matching key found')

  const importedKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  keyCache.set(kid, { key: importedKey, expiresAt: now + JWKS_CACHE_TTL_SECONDS })

  return importedKey
}
