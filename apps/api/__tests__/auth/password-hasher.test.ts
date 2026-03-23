import { describe, expect, it } from 'vitest'

import { createPasswordHasher } from '../../src/infrastructure/auth/password-hasher'

describe('password hasher', () => {
  const hasher = createPasswordHasher()

  it('hashes password with pbkdf2 format', async () => {
    const encoded = await hasher.hashPassword('S3cure!Passw0rd#2026')

    expect(encoded.startsWith('pbkdf2$sha256$')).toBe(true)
    expect(encoded.split('$')).toHaveLength(5)
  })

  it('verifies valid password and rejects invalid password', async () => {
    const encoded = await hasher.hashPassword('S3cure!Passw0rd#2026')

    await expect(hasher.verifyPassword('S3cure!Passw0rd#2026', encoded)).resolves.toBe(true)
    await expect(hasher.verifyPassword('wrong-password', encoded)).resolves.toBe(false)
  })

  it('returns false for malformed hash payload', async () => {
    await expect(hasher.verifyPassword('any', 'invalid-hash')).resolves.toBe(false)
  })
})