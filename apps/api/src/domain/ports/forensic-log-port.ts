export interface ForensicEntry {
  reportId: string
  tokenId: string
  rejectionReason: string
  aiConfidence: number
  contentHash: string
}

export interface ForensicLogPort {
  logRejection(entry: ForensicEntry): Promise<void>
}
