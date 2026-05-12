import { describe, expect, it } from 'vitest'

import { createSecretCipher } from '../../src/infrastructure/auth/secret-cipher'

const VALID_HEX_KEY = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'

describe('secret cipher', () => {
  it('encrypts and decrypts MFA secret', async () => {
    const cipher = createSecretCipher(VALID_HEX_KEY)
    const encrypted = await cipher.encrypt('JBSWY3DPEHPK3PXP')

    expect(encrypted.startsWith('a256gcm$')).toBe(true)
    await expect(cipher.decrypt(encrypted)).resolves.toBe('JBSWY3DPEHPK3PXP')
  })

  it('rejects invalid key format', async () => {
    const cipher = createSecretCipher('abcd')
    await expect(cipher.encrypt('secret')).rejects.toThrow('64 hex chars')
  })
})
