import { describe, expect, it } from 'vitest'

import { createTotpService, generateTotpCode } from '../../src/infrastructure/auth/totp-service'

describe('totp service', () => {
  const totp = createTotpService()

  it('generates a base32 secret and otpauth uri', () => {
    const secret = totp.generateSecret()
    const uri = totp.buildOtpAuthUri({
      issuer: 'MAME',
      accountName: 'student@uni.edu',
      secret,
    })

    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(secret.length).toBeGreaterThanOrEqual(16)
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain('issuer=MAME')
  })

  it('verifies valid code in current time step', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const at = new Date('2026-03-23T10:30:00.000Z')
    const code = await generateTotpCode(secret, at)

    await expect(totp.verifyCode({ secret, code, at })).resolves.toBe(true)
  })

  it('accepts drift within default window and rejects outside window', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const at = new Date('2026-03-23T10:30:00.000Z')
    const previousStep = new Date(at.getTime() - 30_000)
    const oldCode = await generateTotpCode(secret, previousStep)

    await expect(totp.verifyCode({ secret, code: oldCode, at })).resolves.toBe(true)
    await expect(totp.verifyCode({ secret, code: oldCode, at, window: 0 })).resolves.toBe(false)
  })
})
