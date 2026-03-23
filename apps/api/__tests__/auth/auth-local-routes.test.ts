import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppEnv } from '../../src/env'
import { errorHandler } from '../../src/http/middleware/error-handler'
import { authLocalRoutes } from '../../src/http/routes/auth-local-routes'

const {
  authenticateLocalLoginMock,
  beginMfaEnrollmentMock,
  confirmMfaEnrollmentMock,
  verifyMfaChallengeMock,
  findByLoginHashMock,
  findByEmailHashMock,
  insertCredentialMock,
  insertUserMock,
  hashEmailMock,
  hashPasswordMock,
} = vi.hoisted(() => {
  return {
    authenticateLocalLoginMock: vi.fn(),
    beginMfaEnrollmentMock: vi.fn(),
    confirmMfaEnrollmentMock: vi.fn(),
    verifyMfaChallengeMock: vi.fn(),
    findByLoginHashMock: vi.fn(),
    findByEmailHashMock: vi.fn(),
    insertCredentialMock: vi.fn(),
    insertUserMock: vi.fn(),
    hashEmailMock: vi.fn(),
    hashPasswordMock: vi.fn(),
  }
})

vi.mock('../../src/application/security-events.js', () => ({
  recordSecurityEvent: vi.fn(),
}))

vi.mock('../../src/application/auth-local/authenticate-local-login.js', () => ({
  authenticateLocalLogin: authenticateLocalLoginMock,
}))

vi.mock('../../src/application/auth-local/mfa-enrollment.js', () => ({
  beginMfaEnrollment: beginMfaEnrollmentMock,
  confirmMfaEnrollment: confirmMfaEnrollmentMock,
  verifyMfaChallenge: verifyMfaChallengeMock,
}))

vi.mock('../../src/infrastructure/db/connection.js', () => ({
  createDb: vi.fn(() => ({})),
}))

vi.mock('../../src/infrastructure/db/local-auth-repository.js', () => ({
  createLocalAuthRepository: vi.fn(() => ({
    findByLoginHash: findByLoginHashMock,
    insertCredential: insertCredentialMock,
    findByUserId: vi.fn(),
    setFailedAttempts: vi.fn(),
    setMfaState: vi.fn(),
  })),
}))

vi.mock('../../src/infrastructure/db/user-repository.js', () => ({
  createUserRepository: vi.fn(() => ({
    findByEmailHash: findByEmailHashMock,
    insertUser: insertUserMock,
  })),
}))

vi.mock('../../src/infrastructure/auth/crypto-service.js', () => ({
  createCryptoService: vi.fn(() => ({
    hashEmail: hashEmailMock,
    generateRelationProof: vi.fn(),
    generateTokenId: vi.fn(),
    generateDisplayName: vi.fn(),
  })),
}))

vi.mock('../../src/infrastructure/auth/password-hasher.js', () => ({
  createPasswordHasher: vi.fn(() => ({
    hashPassword: hashPasswordMock,
    verifyPassword: vi.fn(),
  })),
}))

vi.mock('../../src/infrastructure/auth/secret-cipher.js', () => ({
  createSecretCipher: vi.fn(() => ({
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  })),
}))

vi.mock('../../src/infrastructure/auth/totp-service.js', () => ({
  createTotpService: vi.fn(() => ({
    generateSecret: vi.fn(),
    buildOtpAuthUri: vi.fn(),
    verifyCode: vi.fn(),
  })),
}))

function createTestApp() {
  const app = new Hono<AppEnv>()
  app.onError(errorHandler)
  app.route('/auth/local', authLocalRoutes)
  return app
}

function makeEnv() {
  return {
    DATABASE_URL: 'postgresql://example',
    ENCRYPTION_MASTER_KEY: 'a'.repeat(64),
    ENCRYPTION_RELATION_KEY: 'b'.repeat(64),
  } as unknown as AppEnv['Bindings']
}

describe('auth local routes', () => {
  const app = createTestApp()

  beforeEach(() => {
    vi.clearAllMocks()
    hashEmailMock.mockResolvedValue('hash:demo@example.com')
    hashPasswordMock.mockResolvedValue('$2b$12$hashed')
    findByLoginHashMock.mockResolvedValue(null)
    findByEmailHashMock.mockResolvedValue(null)
    insertUserMock.mockResolvedValue({ id: 'user_1', role: 'user' })
    insertCredentialMock.mockResolvedValue({})

    authenticateLocalLoginMock.mockResolvedValue({
      status: 'ok',
      userId: 'user_1',
      mfaRequired: true,
    })
    beginMfaEnrollmentMock.mockResolvedValue({ secret: 'ABC123', otpAuthUri: 'otpauth://test' })
    confirmMfaEnrollmentMock.mockResolvedValue(undefined)
    verifyMfaChallengeMock.mockResolvedValue({ status: 'verified' })
  })

  it('registers local user with strong password', async () => {
    const res = await app.request(
      '/auth/local/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'demo@example.com', password: 'Str0ng!Password#2026' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(201)
    expect(insertUserMock).toHaveBeenCalledTimes(1)
    expect(insertCredentialMock).toHaveBeenCalledTimes(1)
  })

  it('returns conflict when local login already exists', async () => {
    findByLoginHashMock.mockResolvedValueOnce({ userId: 'existing_1' })

    const res = await app.request(
      '/auth/local/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'demo@example.com', password: 'Str0ng!Password#2026' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(409)
  })

  it('links local credential to an existing user with same email hash', async () => {
    findByEmailHashMock.mockResolvedValueOnce({ id: 'existing_user_1', role: 'user' })

    const res = await app.request(
      '/auth/local/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'demo@example.com', password: 'Str0ng!Password#2026' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(201)
    expect(insertUserMock).not.toHaveBeenCalled()
    expect(insertCredentialMock).toHaveBeenCalledTimes(1)
  })

  it('returns mfa_required on successful login with MFA enabled', async () => {
    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'demo@example.com', password: 'Str0ng!Password#2026' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { status: string } }
    expect(body.data.status).toBe('mfa_required')
  })

  it('returns locked status when account is locked', async () => {
    authenticateLocalLoginMock.mockResolvedValueOnce({
      status: 'locked',
      lockedUntil: new Date('2026-03-23T18:00:00.000Z'),
    })

    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'demo@example.com', password: 'wrong' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(423)
  })

  it('returns 401 for invalid MFA verification code', async () => {
    verifyMfaChallengeMock.mockResolvedValueOnce({ status: 'invalid_code' })

    const res = await app.request(
      '/auth/local/mfa/verify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: '11111111-1111-1111-1111-111111111111', code: '123456' }),
      },
      makeEnv(),
    )

    expect(res.status).toBe(401)
  })

  it('starts and confirms MFA enrollment', async () => {
    const beginRes = await app.request(
      '/auth/local/mfa/begin',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: '11111111-1111-1111-1111-111111111111',
          accountName: 'demo@example.com',
        }),
      },
      makeEnv(),
    )

    expect(beginRes.status).toBe(200)

    const confirmRes = await app.request(
      '/auth/local/mfa/confirm',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: '11111111-1111-1111-1111-111111111111', code: '123456' }),
      },
      makeEnv(),
    )

    expect(confirmRes.status).toBe(200)
    expect(beginMfaEnrollmentMock).toHaveBeenCalledTimes(1)
    expect(confirmMfaEnrollmentMock).toHaveBeenCalledTimes(1)
  })
})