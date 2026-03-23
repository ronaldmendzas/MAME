import { describe, expect, it } from 'vitest'

import { createPasswordHasher } from '../../src/infrastructure/auth/password-hasher'

describe('password hasher', () => {
  const hasher = createPasswordHasher()

  it('hashes password with bcrypt format', async () => {
    const encoded = await hasher.hashPassword('S3cure!Passw0rd#2026')

    expect(encoded.startsWith('$2')).toBe(true)
  })

  it('verifies valid password and rejects invalid password', async () => {
    const encoded = await hasher.hashPassword('S3cure!Passw0rd#2026')

    await expect(hasher.verifyPassword('S3cure!Passw0rd#2026', encoded)).resolves.toBe(true)
    await expect(hasher.verifyPassword('wrong-password', encoded)).resolves.toBe(false)
  })

  it('returns false for malformed hash payload', async () => {
    await expect(hasher.verifyPassword('any', 'invalid-hash')).resolves.toBe(false)
  })

  it('verifies legacy pbkdf2 hashes for backward compatibility', async () => {
    const password = 'S3cure!Passw0rd#2026'
    const salt = Uint8Array.from(Array.from({ length: 16 }, (_, index) => index + 1))
    const imported = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, imported, 256)
    const hash = Buffer.from(bits).toString('base64url')
    const legacyHash = `pbkdf2$sha256$210000$${Buffer.from(salt).toString('base64url')}$${hash}`

    await expect(hasher.verifyPassword(password, legacyHash)).resolves.toBe(true)
    await expect(hasher.verifyPassword('wrong-password', legacyHash)).resolves.toBe(false)
  })
})