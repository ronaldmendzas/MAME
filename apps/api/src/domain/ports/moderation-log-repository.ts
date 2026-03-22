export type ModerationAction = 'approve' | 'reject' | 'request_info' | 'escalate' | 'edit'

export interface ModerationLogRow {
  id: string
  reportId: string
  moderatorToken: string
  action: ModerationAction
  reason: string | null
  createdAt: Date
}

export interface InsertModerationLogData {
  reportId: string
  moderatorToken: string
  action: ModerationAction
  reason: string | null
}

export interface ModerationLogRepository {
  insert(data: InsertModerationLogData): Promise<ModerationLogRow>
  findByReportId(reportId: string): Promise<ModerationLogRow[]>
}
