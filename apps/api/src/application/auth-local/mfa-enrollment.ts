import { ValidationError } from '../../domain/errors.js'
import type { LocalAuthRepository } from '../../domain/ports/local-auth-repository.js'
import type { SecretCipher } from '../../domain/ports/secret-cipher.js'
import type { TotpService } from '../../domain/ports/totp-service.js'

const DEFAULT_ISSUER = 'MAME'

export interface BeginMfaEnrollmentInput {
  userId: string
  accountName: string
  issuer?: string | undefined
}

export interface BeginMfaEnrollmentDeps {
  localAuthRepo: Pick<LocalAuthRepository, 'findByUserId' | 'setMfaState'>
  secretCipher: SecretCipher
  totpService: TotpService
}

export interface BeginMfaEnrollmentResult {
  secret: string
  otpAuthUri: string
}

export async function beginMfaEnrollment(
  input: BeginMfaEnrollmentInput,
  deps: BeginMfaEnrollmentDeps,
): Promise<BeginMfaEnrollmentResult> {
  const credential = await deps.localAuthRepo.findByUserId(input.userId)
  if (!credential) throw new ValidationError('Local credential not found')
  if (credential.mfaEnabled) throw new ValidationError('MFA is already enabled')

  const secret = deps.totpService.generateSecret()
  const encrypted = await deps.secretCipher.encrypt(secret)
  await deps.localAuthRepo.setMfaState(input.userId, false, encrypted)

  const issuer = input.issuer?.trim() || DEFAULT_ISSUER
  return {
    secret,
    otpAuthUri: deps.totpService.buildOtpAuthUri({
      issuer,
      accountName: input.accountName,
      secret,
    }),
  }
}

export interface ConfirmMfaEnrollmentInput {
  userId: string
  code: string
}

export interface ConfirmMfaEnrollmentDeps {
  localAuthRepo: Pick<LocalAuthRepository, 'findByUserId' | 'setMfaState'>
  secretCipher: SecretCipher
  totpService: TotpService
  now?: () => Date
}

export async function confirmMfaEnrollment(
  input: ConfirmMfaEnrollmentInput,
  deps: ConfirmMfaEnrollmentDeps,
): Promise<void> {
  const credential = await deps.localAuthRepo.findByUserId(input.userId)
  if (!credential?.mfaSecretCiphertext) {
    throw new ValidationError('MFA enrollment is not initialized')
  }

  const secret = await deps.secretCipher.decrypt(credential.mfaSecretCiphertext)
  const isValid = await deps.totpService.verifyCode({
    secret,
    code: input.code,
    at: deps.now?.() ?? new Date(),
  })

  if (!isValid) throw new ValidationError('Invalid MFA code')
  await deps.localAuthRepo.setMfaState(input.userId, true, credential.mfaSecretCiphertext)
}

export interface VerifyMfaChallengeInput {
  userId: string
  code: string
}

export interface VerifyMfaChallengeDeps {
  localAuthRepo: Pick<LocalAuthRepository, 'findByUserId'>
  secretCipher: SecretCipher
  totpService: TotpService
  now?: () => Date
}

export type VerifyMfaChallengeResult = { status: 'verified' } | { status: 'invalid_code' }

export async function verifyMfaChallenge(
  input: VerifyMfaChallengeInput,
  deps: VerifyMfaChallengeDeps,
): Promise<VerifyMfaChallengeResult> {
  const credential = await deps.localAuthRepo.findByUserId(input.userId)
  if (!credential?.mfaEnabled || !credential.mfaSecretCiphertext) {
    throw new ValidationError('MFA is not enabled')
  }

  const secret = await deps.secretCipher.decrypt(credential.mfaSecretCiphertext)
  const isValid = await deps.totpService.verifyCode({
    secret,
    code: input.code,
    at: deps.now?.() ?? new Date(),
  })

  return isValid ? { status: 'verified' } : { status: 'invalid_code' }
}
