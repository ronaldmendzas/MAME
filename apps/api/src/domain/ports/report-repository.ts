import type { ReportCategory, ReportStatus } from '../types.js'

export interface ReportRow {
  id: string
  tokenId: string
  title: string
  body: string
  category: ReportCategory
  faculty: string
  status: ReportStatus
  votes: number
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

export interface InsertReportData {
  tokenId: string
  title: string
  body: string
  category: ReportCategory
  faculty: string
  status: ReportStatus
}

export interface ReportFilters {
  category?: ReportCategory | undefined
  faculty?: string | undefined
  dateFrom?: Date | undefined
  dateTo?: Date | undefined
}

export interface ReportRepository {
  insert(data: InsertReportData): Promise<ReportRow>
  findById(id: string): Promise<ReportRow | null>
  findPublished(cursor: string | null, limit: number, filters: ReportFilters): Promise<ReportRow[]>
  findByTokenId(tokenId: string, cursor: string | null, limit: number): Promise<ReportRow[]>
  update(
    id: string,
    data: Partial<Pick<ReportRow, 'title' | 'body' | 'status' | 'publishedAt'>>,
  ): Promise<ReportRow>
}
