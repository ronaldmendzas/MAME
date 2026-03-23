import { Hono } from 'hono'
import { z } from 'zod'

import { authenticateLocalLogin } from '../../application/auth-local/authenticate-local-login.js'
import {
  beginMfaEnrollment,
  confirmMfaEnrollment,
  verifyMfaChallenge,
} from '../../application/auth-local/mfa-enrollment.js'
import { assertStrongPassword } from '../../application/auth-local/password-policy.js'
import { recordSecurityEvent } from '../../application/security-events.js'
import { ConflictError, ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createCryptoService } from '../../infrastructure/auth/crypto-service.js'
import { createPasswordHasher } from '../../infrastructure/auth/password-hasher.js'
import { createSecretCipher } from '../../infrastructure/auth/secret-cipher.js'
import { createTotpService } from '../../infrastructure/auth/totp-service.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createLocalAuthRepository } from '../../infrastructure/db/local-auth-repository.js'
import { createUserRepository } from '../../infrastructure/db/user-repository.js'

const registerSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
})

const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
})

const mfaBeginSchema = z.object({
  userId: z.string().uuid(),
  accountName: z.string().min(3),
  issuer: z.string().min(1).optional(),
})

const mfaCodeSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/),
})

const authLocalRoutes = new Hono<AppEnv>()

authLocalRoutes.post('/register', async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json())
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid payload')

  const login = parsed.data.login.trim().toLowerCase()
  const password = parsed.data.password

  assertStrongPassword(password, login)

  const db = createDb(c.env.DATABASE_URL)
  const localAuthRepo = createLocalAuthRepository(db)
  const userRepo = createUserRepository(db)
  const cryptoService = createCryptoService(c.env.ENCRYPTION_MASTER_KEY, c.env.ENCRYPTION_RELATION_KEY)
  const passwordHasher = createPasswordHasher()

  const loginHash = await cryptoService.hashEmail(login)
  const existing = await localAuthRepo.findByLoginHash(loginHash)
  if (existing) throw new ConflictError('Local login')

  const existingUser = await userRepo.findByEmailHash(loginHash)
  const passwordHash = await passwordHasher.hashPassword(password)
  const user =
    existingUser ??
    (await userRepo.insertUser({
      clerkId: `local:${crypto.randomUUID()}`,
      emailHash: loginHash,
      role: 'user',
    }))

  await localAuthRepo.insertCredential({
    userId: user.id,
    loginHash,
    passwordHash,
    passwordAlgo: 'bcrypt',
  })

  void recordSecurityEvent(c.env, {
    eventType: 'auth_success',
    outcome: 'allowed',
    source: 'auth_local_register',
    target: c.req.path,
    details: { userId: user.id, linkedExistingUser: Boolean(existingUser) },
  })

  return c.json({
    success: true,
    data: { userId: user.id, mfaEnabled: false, role: user.role },
  }, 201)
})

authLocalRoutes.post('/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json())
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid payload')

  const db = createDb(c.env.DATABASE_URL)
  const localAuthRepo = createLocalAuthRepository(db)
  const cryptoService = createCryptoService(c.env.ENCRYPTION_MASTER_KEY, c.env.ENCRYPTION_RELATION_KEY)
  const passwordHasher = createPasswordHasher()

  const result = await authenticateLocalLogin(parsed.data, {
    cryptoService,
    localAuthRepo,
    passwordHasher,
  })

  if (result.status === 'invalid_credentials') {
    void recordSecurityEvent(c.env, {
      eventType: 'auth_failure',
      outcome: 'denied',
      source: 'auth_local_login',
      target: c.req.path,
      details: { reason: 'invalid_credentials' },
    })
    return c.json({ success: false, code: 'UNAUTHORIZED', status: result.status }, 401)
  }

  if (result.status === 'locked') {
    void recordSecurityEvent(c.env, {
      eventType: 'auth_failure',
      outcome: 'denied',
      source: 'auth_local_login',
      target: c.req.path,
      details: { reason: 'locked', lockedUntil: result.lockedUntil.toISOString() },
    })
    return c.json({ success: false, code: 'LOCKED', status: result.status, lockedUntil: result.lockedUntil.toISOString() }, 423)
  }

  void recordSecurityEvent(c.env, {
    eventType: 'auth_success',
    outcome: 'allowed',
    source: 'auth_local_login',
    target: c.req.path,
    details: { userId: result.userId, mfaRequired: result.mfaRequired },
  })

  return c.json({
    success: true,
    data: {
      userId: result.userId,
      status: result.mfaRequired ? 'mfa_required' : 'authenticated',
      mfaRequired: result.mfaRequired,
    },
  })
})

authLocalRoutes.post('/mfa/begin', async (c) => {
  const parsed = mfaBeginSchema.safeParse(await c.req.json())
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid payload')

  const db = createDb(c.env.DATABASE_URL)
  const localAuthRepo = createLocalAuthRepository(db)
  const secretCipher = createSecretCipher(c.env.ENCRYPTION_MASTER_KEY)
  const totpService = createTotpService()

  const result = await beginMfaEnrollment(parsed.data, {
    localAuthRepo,
    secretCipher,
    totpService,
  })

  return c.json({ success: true, data: result })
})

authLocalRoutes.post('/mfa/confirm', async (c) => {
  const parsed = mfaCodeSchema.safeParse(await c.req.json())
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid payload')

  const db = createDb(c.env.DATABASE_URL)
  const localAuthRepo = createLocalAuthRepository(db)
  const secretCipher = createSecretCipher(c.env.ENCRYPTION_MASTER_KEY)
  const totpService = createTotpService()

  await confirmMfaEnrollment(parsed.data, {
    localAuthRepo,
    secretCipher,
    totpService,
  })

  return c.json({ success: true, data: { status: 'mfa_enabled' } })
})

authLocalRoutes.post('/mfa/verify', async (c) => {
  const parsed = mfaCodeSchema.safeParse(await c.req.json())
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid payload')

  const db = createDb(c.env.DATABASE_URL)
  const localAuthRepo = createLocalAuthRepository(db)
  const secretCipher = createSecretCipher(c.env.ENCRYPTION_MASTER_KEY)
  const totpService = createTotpService()

  const result = await verifyMfaChallenge(parsed.data, {
    localAuthRepo,
    secretCipher,
    totpService,
  })

  if (result.status === 'invalid_code') {
    return c.json({ success: false, code: 'UNAUTHORIZED', status: result.status }, 401)
  }

  return c.json({ success: true, data: result })
})

export { authLocalRoutes }