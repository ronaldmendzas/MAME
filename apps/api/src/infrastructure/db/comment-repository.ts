import { count, eq } from 'drizzle-orm'

import type { Database } from './connection.js'
import { comments } from './schema/comments.js'

export function createCommentRepository(db: Database) {
  return {
    async countByReportId(reportId: string): Promise<number> {
      const result = await db
        .select({ value: count() })
        .from(comments)
        .where(eq(comments.reportId, reportId))
      return result[0]?.value ?? 0
    },
  }
}
