export interface LocalAuthRepository {
  findByLoginHash(loginHash: string): Promise<LocalAuthCredential | null>
  findByUserId(userId: string): Promise<LocalAuthCredential | null>
  insertCredential(data: InsertLocalAuthCredential): Promise<LocalAuthCredential>
  setFailedAttempts(userId: string, attempts: number, lockedUntil: Date | null): Promise<void>
  setMfaState(userId: string, enabled: boolean, secretCiphertext: string | null): Promise<void>
}

export interface InsertLocalAuthCredential {
  userId: string
  loginHash: string
  passwordHash: string
  passwordAlgo: string
}

export interface LocalAuthCredential {
  userId: string
  loginHash: string
  passwordHash: string
  passwordAlgo: string
  failedAttempts: number
  lockedUntil: Date | null
  mfaSecretCiphertext: string | null
  mfaEnabled: boolean
  createdAt: Date
}
