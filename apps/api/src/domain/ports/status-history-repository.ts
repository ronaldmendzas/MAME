import type { ReportStatus } from '../types.js'

export interface StatusHistoryRow {
  id: string
  reportId: string
  oldStatus: ReportStatus
  newStatus: ReportStatus
  changedByToken: string
  reason: string | null
  createdAt: Date
}

export interface InsertStatusHistoryData {
  reportId: string
  oldStatus: ReportStatus
  newStatus: ReportStatus
  changedByToken: string
  reason?: string | undefined
}

export interface StatusHistoryRepository {
  insert(data: InsertStatusHistoryData): Promise<StatusHistoryRow>
  findByReportId(reportId: string): Promise<StatusHistoryRow[]>
}
