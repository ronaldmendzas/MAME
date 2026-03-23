import { describe, expect, it, vi } from 'vitest'

import { authenticateLocalLogin } from '../../src/application/auth-local/authenticate-local-login'

function createDeps(overrides?: {
  credential?: {
    userId: string
    loginHash: string
    passwordHash: string
    passwordAlgo: string
    failedAttempts: number
    lockedUntil: Date | null
    mfaSecretCiphertext: string | null
    mfaEnabled: boolean
    createdAt: Date
  } | null
  verifyPassword?: boolean
  now?: Date
}) {
  const credential = overrides && 'credential' in overrides
    ? overrides.credential
    : {
    userId: 'user-1',
    loginHash: 'hash-login',
    passwordHash: 'stored-hash',
    passwordAlgo: 'pbkdf2-sha256',
    failedAttempts: 0,
    lockedUntil: null,
    mfaSecretCiphertext: null,
    mfaEnabled: false,
    createdAt: new Date('2026-03-23T00:00:00.000Z'),
    }

  return {
    cryptoService: {
      hashEmail: vi.fn().mockResolvedValue('hash-login'),
    },
    localAuthRepo: {
      findByLoginHash: vi.fn().mockResolvedValue(credential),
      setFailedAttempts: vi.fn().mockResolvedValue(undefined),
    },
    passwordHasher: {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn().mockResolvedValue(overrides?.verifyPassword ?? true),
    },
    now: () => overrides?.now ?? new Date('2026-03-23T10:00:00.000Z'),
  }
}

describe('authenticateLocalLogin', () => {
  it('returns ok when credentials are valid', async () => {
    const deps = createDeps({ verifyPassword: true })

    const result = await authenticateLocalLogin(
      { login: 'Student@University.edu', password: 'S3cure!Passw0rd#2026' },
      deps,
    )

    expect(result).toEqual({ status: 'ok', userId: 'user-1', mfaRequired: false })
    expect(deps.cryptoService.hashEmail).toHaveBeenCalledWith('student@university.edu')
    expect(deps.localAuthRepo.setFailedAttempts).not.toHaveBeenCalled()
  })

  it('returns invalid_credentials for unknown login', async () => {
    const deps = createDeps({ credential: null })

    const result = await authenticateLocalLogin(
      { login: 'missing@uni.edu', password: 'S3cure!Passw0rd#2026' },
      deps,
    )

    expect(result).toEqual({ status: 'invalid_credentials' })
  })

  it('increments failed attempts on invalid password', async () => {
    const deps = createDeps({ verifyPassword: false })

    const result = await authenticateLocalLogin(
      { login: 'student@uni.edu', password: 'wrong-password' },
      deps,
    )

    expect(result).toEqual({ status: 'invalid_credentials' })
    expect(deps.localAuthRepo.setFailedAttempts).toHaveBeenCalledWith('user-1', 1, null)
  })

  it('locks account after fifth failed attempt', async () => {
    const deps = createDeps({
      verifyPassword: false,
      credential: {
        userId: 'user-1',
        loginHash: 'hash-login',
        passwordHash: 'stored-hash',
        passwordAlgo: 'pbkdf2-sha256',
        failedAttempts: 4,
        lockedUntil: null,
        mfaSecretCiphertext: null,
        mfaEnabled: false,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
      },
      now: new Date('2026-03-23T10:00:00.000Z'),
    })

    const result = await authenticateLocalLogin(
      { login: 'student@uni.edu', password: 'wrong-password' },
      deps,
    )

    expect(result.status).toBe('locked')
    expect(deps.localAuthRepo.setFailedAttempts).toHaveBeenCalledWith(
      'user-1',
      5,
      new Date('2026-03-23T10:15:00.000Z'),
    )
  })

  it('resets counters on successful login after previous failures', async () => {
    const deps = createDeps({
      verifyPassword: true,
      credential: {
        userId: 'user-1',
        loginHash: 'hash-login',
        passwordHash: 'stored-hash',
        passwordAlgo: 'pbkdf2-sha256',
        failedAttempts: 2,
        lockedUntil: null,
        mfaSecretCiphertext: null,
        mfaEnabled: true,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
      },
    })

    const result = await authenticateLocalLogin(
      { login: 'student@uni.edu', password: 'S3cure!Passw0rd#2026' },
      deps,
    )

    expect(result).toEqual({ status: 'ok', userId: 'user-1', mfaRequired: true })
    expect(deps.localAuthRepo.setFailedAttempts).toHaveBeenCalledWith('user-1', 0, null)
  })

  it('returns locked when account is currently locked', async () => {
    const deps = createDeps({
      credential: {
        userId: 'user-1',
        loginHash: 'hash-login',
        passwordHash: 'stored-hash',
        passwordAlgo: 'pbkdf2-sha256',
        failedAttempts: 5,
        lockedUntil: new Date('2026-03-23T10:20:00.000Z'),
        mfaSecretCiphertext: null,
        mfaEnabled: false,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
      },
      now: new Date('2026-03-23T10:00:00.000Z'),
    })

    const result = await authenticateLocalLogin(
      { login: 'student@uni.edu', password: 'any' },
      deps,
    )

    expect(result).toEqual({ status: 'locked', lockedUntil: new Date('2026-03-23T10:20:00.000Z') })
    expect(deps.passwordHasher.verifyPassword).not.toHaveBeenCalled()
  })
})