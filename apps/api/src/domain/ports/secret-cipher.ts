export interface SecretCipher {
  encrypt(plainText: string): Promise<string>
  decrypt(cipherText: string): Promise<string>
}