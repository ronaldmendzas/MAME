import { count, desc, eq } from 'drizzle-orm'

import type {
  CommentRepository,
  CommentRow,
  InsertCommentData,
} from '../../domain/ports/comment-repository.js'

import type { Database } from './connection.js'
import { comments } from './schema/comments.js'

export function createCommentRepository(db: Database): CommentRepository {
  return {
    async insert(data: InsertCommentData): Promise<CommentRow> {
      const [row] = await db.insert(comments).values(data).returning()
      return mapRow(row!)
    },

    async findByReportId(reportId: string): Promise<CommentRow[]> {
      const rows = await db
        .select()
        .from(comments)
        .where(eq(comments.reportId, reportId))
        .orderBy(desc(comments.createdAt))
      return rows.map(mapRow)
    },

    async findById(id: string): Promise<CommentRow | null> {
      const [row] = await db.select().from(comments).where(eq(comments.id, id))
      return row ? mapRow(row) : null
    },

    async deleteById(id: string): Promise<void> {
      await db.delete(comments).where(eq(comments.id, id))
    },

    async countByReportId(reportId: string): Promise<number> {
      const result = await db
        .select({ value: count() })
        .from(comments)
        .where(eq(comments.reportId, reportId))
      return result[0]?.value ?? 0
    },
  }
}

function mapRow(row: typeof comments.$inferSelect): CommentRow {
  return {
    id: row.id,
    reportId: row.reportId,
    tokenId: row.tokenId,
    parentId: row.parentId,
    body: row.body,
    createdAt: row.createdAt,
  }
}
