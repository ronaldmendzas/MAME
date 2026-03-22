export type FlagCategory = 'false_report' | 'inappropriate' | 'exposed_data' | 'harassment' | 'other'

export interface FlagRow {
  id: string
  reportId: string
  tokenId: string
  category: FlagCategory
  reason: string | null
  createdAt: Date
}

export interface InsertFlagData {
  reportId: string
  tokenId: string
  category: FlagCategory
  reason: string | null
}

export interface FlagRepository {
  insert(data: InsertFlagData): Promise<FlagRow>
  findByReportAndToken(reportId: string, tokenId: string): Promise<FlagRow | null>
  countByReportId(reportId: string): Promise<number>
}
