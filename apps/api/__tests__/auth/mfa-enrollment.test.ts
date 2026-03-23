import { describe, expect, it, vi } from 'vitest'

import {
  beginMfaEnrollment,
  confirmMfaEnrollment,
  verifyMfaChallenge,
} from '../../src/application/auth-local/mfa-enrollment'

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
  verifyCode?: boolean
}) {
  const credential = overrides && 'credential' in overrides
    ? overrides.credential
    : {
      userId: 'user-1',
      loginHash: 'hash-login',
      passwordHash: 'stored',
      passwordAlgo: 'pbkdf2-sha256',
      failedAttempts: 0,
      lockedUntil: null,
      mfaSecretCiphertext: null,
      mfaEnabled: false,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    }

  return {
    localAuthRepo: {
      findByUserId: vi.fn().mockResolvedValue(credential),
      setMfaState: vi.fn().mockResolvedValue(undefined),
    },
    secretCipher: {
      encrypt: vi.fn().mockResolvedValue('ciphertext-secret'),
      decrypt: vi.fn().mockResolvedValue('JBSWY3DPEHPK3PXP'),
    },
    totpService: {
      generateSecret: vi.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
      buildOtpAuthUri: vi.fn().mockReturnValue('otpauth://totp/test'),
      verifyCode: vi.fn().mockResolvedValue(overrides?.verifyCode ?? true),
    },
    now: () => new Date('2026-03-23T10:40:00.000Z'),
  }
}

describe('mfa enrollment use cases', () => {
  it('starts enrollment and stores encrypted secret', async () => {
    const deps = createDeps()

    const result = await beginMfaEnrollment(
      { userId: 'user-1', accountName: 'student@uni.edu', issuer: 'MAME' },
      deps,
    )

    expect(result).toEqual({ secret: 'JBSWY3DPEHPK3PXP', otpAuthUri: 'otpauth://totp/test' })
    expect(deps.localAuthRepo.setMfaState).toHaveBeenCalledWith('user-1', false, 'ciphertext-secret')
  })

  it('confirms enrollment with valid TOTP code', async () => {
    const deps = createDeps({
      credential: {
        userId: 'user-1',
        loginHash: 'hash-login',
        passwordHash: 'stored',
        passwordAlgo: 'pbkdf2-sha256',
        failedAttempts: 0,
        lockedUntil: null,
        mfaSecretCiphertext: 'ciphertext-secret',
        mfaEnabled: false,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
      },
      verifyCode: true,
    })

    await confirmMfaEnrollment({ userId: 'user-1', code: '123456' }, deps)
    expect(deps.localAuthRepo.setMfaState).toHaveBeenCalledWith('user-1', true, 'ciphertext-secret')
  })

  it('returns invalid_code when challenge code does not verify', async () => {
    const deps = createDeps({
      credential: {
        userId: 'user-1',
        loginHash: 'hash-login',
        passwordHash: 'stored',
        passwordAlgo: 'pbkdf2-sha256',
        failedAttempts: 0,
        lockedUntil: null,
        mfaSecretCiphertext: 'ciphertext-secret',
        mfaEnabled: true,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
      },
      verifyCode: false,
    })

    const result = await verifyMfaChallenge({ userId: 'user-1', code: '000000' }, deps)
    expect(result).toEqual({ status: 'invalid_code' })
  })
})