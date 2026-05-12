import { ValidationError } from '../../domain/errors.js'

const MIN_PASSWORD_LENGTH = 12

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'qwerty123',
  '12345678',
  '123456789',
  '1234567890',
  'admin123',
  'letmein123',
  'welcome123',
  'iloveyou123',
  'abc123456',
  'dragon123',
])

export function assertStrongPassword(password: string, loginHint?: string): void {
  const problems = getPasswordPolicyProblems(password, loginHint)
  if (problems.length === 0) return
  throw new ValidationError(`Weak password: ${problems.join('; ')}`)
}

export function getPasswordPolicyProblems(password: string, loginHint?: string): string[] {
  const problems: string[] = []
  const normalized = password.trim()
  const lowered = normalized.toLowerCase()

  if (normalized.length < MIN_PASSWORD_LENGTH) {
    problems.push(`must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  if (!/[A-Z]/.test(normalized)) problems.push('must include an uppercase letter')
  if (!/[a-z]/.test(normalized)) problems.push('must include a lowercase letter')
  if (!/\d/.test(normalized)) problems.push('must include a number')
  if (!/[^A-Za-z0-9]/.test(normalized)) problems.push('must include a symbol')
  const canonical = lowered.replace(/[^a-z0-9]/g, '')
  if (COMMON_PASSWORDS.has(lowered) || COMMON_PASSWORDS.has(canonical))
    problems.push('is too common')
  if (/(.)\1\1\1/.test(normalized)) problems.push('cannot contain four repeated characters')

  const hint = normalizeLoginHint(loginHint)
  if (hint && hint.length >= 3 && lowered.includes(hint)) {
    problems.push('cannot contain your login identifier')
  }

  return problems
}

function normalizeLoginHint(loginHint: string | undefined): string {
  if (!loginHint) return ''
  const base = loginHint.toLowerCase().trim()
  const at = base.indexOf('@')
  return at > 0 ? base.slice(0, at) : base
}
