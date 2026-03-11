export interface LinkRecord {
  tokenId: string
}

export interface IdentityLinkRepository {
  insertLink(data: InsertLinkData): Promise<void>
  findByEmailHash(emailHash: string): Promise<LinkRecord | null>
}

export interface InsertLinkData {
  emailHash: string
  tokenId: string
  relationProof: string
}
