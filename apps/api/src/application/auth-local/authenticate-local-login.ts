import { ValidationError } from '../../domain/errors.js'
import type { CryptoService } from '../../domain/ports/crypto-service.js'
import type { LocalAuthRepository } from '../../domain/ports/local-auth-repository.js'
import type { PasswordHasher } from '../../domain/ports/password-hasher.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export interface AuthenticateLocalLoginInput {
  login: string
  password: string
}

export interface AuthenticateLocalLoginDeps {
  cryptoService: Pick<CryptoService, 'hashEmail'>
  localAuthRepo: Pick<
    LocalAuthRepository,
    'findByLoginHash' | 'setFailedAttempts'
  >
  passwordHasher: PasswordHasher
  now?: () => Date
}

export type AuthenticateLocalLoginResult =
  | { status: 'ok'; userId: string; mfaRequired: boolean }
  | { status: 'invalid_credentials' }
  | { status: 'locked'; lockedUntil: Date }

export async function authenticateLocalLogin(
  input: AuthenticateLocalLoginInput,
  deps: AuthenticateLocalLoginDeps,
): Promise<AuthenticateLocalLoginResult> {
  const login = input.login?.trim().toLowerCase()
  const password = input.password ?? ''
  if (!login || !password) throw new ValidationError('Login and password are required')

  const now = deps.now?.() ?? new Date()
  const loginHash = await deps.cryptoService.hashEmail(login)
  const credential = await deps.localAuthRepo.findByLoginHash(loginHash)
  if (!credential) return { status: 'invalid_credentials' }

  if (credential.lockedUntil && credential.lockedUntil.getTime() > now.getTime()) {
    return { status: 'locked', lockedUntil: credential.lockedUntil }
  }

  const isValid = await deps.passwordHasher.verifyPassword(password, credential.passwordHash)
  if (!isValid) {
    const failedAttempts = credential.failedAttempts + 1
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS
    const lockedUntil = shouldLock ? addMinutes(now, LOCKOUT_MINUTES) : null
    await deps.localAuthRepo.setFailedAttempts(credential.userId, failedAttempts, lockedUntil)
    if (lockedUntil) return { status: 'locked', lockedUntil }
    return { status: 'invalid_credentials' }
  }

  if (credential.failedAttempts > 0 || credential.lockedUntil) {
    await deps.localAuthRepo.setFailedAttempts(credential.userId, 0, null)
  }

  return {
    status: 'ok',
    userId: credential.userId,
    mfaRequired: credential.mfaEnabled,
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}