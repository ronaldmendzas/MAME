import { desc, eq } from 'drizzle-orm'

import type {
  InsertModerationLogData,
  ModerationLogRepository,
  ModerationLogRow,
} from '../../domain/ports/moderation-log-repository.js'

import type { Database } from './connection.js'
import { moderationLog } from './schema/moderation.js'

export function createModerationLogRepository(db: Database): ModerationLogRepository {
  return {
    async insert(data: InsertModerationLogData): Promise<ModerationLogRow> {
      const [row] = await db.insert(moderationLog).values(data).returning()
      return mapRow(row!)
    },

    async findByReportId(reportId: string): Promise<ModerationLogRow[]> {
      const rows = await db
        .select()
        .from(moderationLog)
        .where(eq(moderationLog.reportId, reportId))
        .orderBy(desc(moderationLog.createdAt))
      return rows.map(mapRow)
    },
  }
}

function mapRow(row: typeof moderationLog.$inferSelect): ModerationLogRow {
  return {
    id: row.id,
    reportId: row.reportId,
    moderatorToken: row.moderatorToken,
    action: row.action,
    reason: row.reason,
    createdAt: row.createdAt,
  }
}
