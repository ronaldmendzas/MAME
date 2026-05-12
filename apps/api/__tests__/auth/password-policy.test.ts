import { describe, expect, it } from 'vitest'

import {
  assertStrongPassword,
  getPasswordPolicyProblems,
} from '../../src/application/auth-local/password-policy'

describe('password policy', () => {
  it('accepts strong password', () => {
    expect(() => assertStrongPassword('S3cure!Passw0rd#2026', 'student@uni.edu')).not.toThrow()
  })

  it('rejects weak password with detailed reasons', () => {
    const reasons = getPasswordPolicyProblems('weakpass', 'weakpass@uni.edu')
    expect(reasons).toContain('must be at least 12 characters')
    expect(reasons).toContain('must include an uppercase letter')
    expect(reasons).toContain('must include a number')
    expect(reasons).toContain('must include a symbol')
    expect(reasons).toContain('cannot contain your login identifier')
  })

  it('rejects repeated characters and common passwords', () => {
    expect(getPasswordPolicyProblems('Password123!')).toContain('is too common')
    expect(getPasswordPolicyProblems('AAAAaaaa1111!')).toContain(
      'cannot contain four repeated characters',
    )
  })

  it('throws validation error for weak input', () => {
    expect(() => assertStrongPassword('password123')).toThrow('Weak password')
  })
})
