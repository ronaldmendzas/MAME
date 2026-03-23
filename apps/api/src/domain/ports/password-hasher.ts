export interface PasswordHasher {
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, encodedHash: string): Promise<boolean>
}