import type { Context, Next } from 'hono'

import { recordSecurityEvent } from '../../application/security-events.js'
import { UnauthorizedError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'

import { verifyJwt, type JwtPayload, type TokenMetadata } from './jwt-verify.js'

export type { JwtPayload, TokenMetadata }
export { verifyJwt }

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
      expectedJwksUrl: c.env?.CLERK_JWKS_URL,
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
