export interface VoteRow {
  id: string
  reportId: string
  tokenId: string
  createdAt: Date
}

export interface InsertVoteData {
  reportId: string
  tokenId: string
}

export interface VoteRepository {
  insert(data: InsertVoteData): Promise<VoteRow>
  findByReportAndToken(reportId: string, tokenId: string): Promise<VoteRow | null>
  deleteByReportAndToken(reportId: string, tokenId: string): Promise<void>
}
