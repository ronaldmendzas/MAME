export interface CryptoService {
  hashEmail(email: string): Promise<string>
  generateRelationProof(emailHash: string, tokenId: string): Promise<string>
  generateTokenId(): string
  generateDisplayName(): string
}
