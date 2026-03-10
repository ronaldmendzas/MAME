export interface IdentityLinkRepository {
  insertLink(data: InsertLinkData): Promise<void>
}

export interface InsertLinkData {
  emailHash: string
  tokenId: string
  relationProof: string
}
