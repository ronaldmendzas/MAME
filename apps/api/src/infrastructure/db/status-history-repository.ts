import { desc, eq } from 'drizzle-orm'

import type { Database } from './connection'
import type {
  InsertStatusHistoryData,
  StatusHistoryRepository,
  StatusHistoryRow,
} from '../../domain/ports/status-history-repository'
import { reportStatusHistory } from './schema/moderation'

export function createStatusHistoryRepository(db: Database): StatusHistoryRepository {
  return {
    async insert(data: InsertStatusHistoryData): Promise<StatusHistoryRow> {
      const [row] = await db
        .insert(reportStatusHistory)
        .values(data)
        .returning()
      return mapRow(row!)
    },

    async findByReportId(reportId: string): Promise<StatusHistoryRow[]> {
      const rows = await db
        .select()
        .from(reportStatusHistory)
        .where(eq(reportStatusHistory.reportId, reportId))
        .orderBy(desc(reportStatusHistory.createdAt))
      return rows.map(mapRow)
    },
  }
}

function mapRow(row: typeof reportStatusHistory.$inferSelect): StatusHistoryRow {
  return {
    id: row.id,
    reportId: row.reportId,
    oldStatus: row.oldStatus,
    newStatus: row.newStatus,
    changedByToken: row.changedByToken,
    reason: row.reason,
    createdAt: row.createdAt,
  }
}
