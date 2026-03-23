export interface TotpService {
  generateSecret(): string
  buildOtpAuthUri(input: BuildOtpAuthUriInput): string
  verifyCode(input: VerifyTotpCodeInput): Promise<boolean>
}

export interface BuildOtpAuthUriInput {
  issuer: string
  accountName: string
  secret: string
}

export interface VerifyTotpCodeInput {
  secret: string
  code: string
  at?: Date
  window?: number
}