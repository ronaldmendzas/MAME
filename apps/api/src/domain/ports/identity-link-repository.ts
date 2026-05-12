export interface IdentityLinkRepository {
  insertLink(data: InsertLinkData): Promise<void>
}

export interface InsertLinkData {
  relationProof: string
}
