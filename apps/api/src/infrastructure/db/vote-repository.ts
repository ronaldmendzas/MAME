import { and, eq } from 'drizzle-orm'

import type { InsertVoteData, VoteRepository, VoteRow } from '../../domain/ports/vote-repository.js'

import type { Database } from './connection.js'
import { reports } from './schema/reports.js'
import { votes } from './schema/votes.js'

export function createVoteRepository(db: Database): VoteRepository {
  return {
    async insert(data: InsertVoteData): Promise<VoteRow> {
      const [row] = await db.insert(votes).values(data).returning()
      await incrementVoteCount(db, data.reportId)
      return mapRow(row!)
    },

    async findByReportAndToken(reportId: string, tokenId: string): Promise<VoteRow | null> {
      const [row] = await db
        .select()
        .from(votes)
        .where(and(eq(votes.reportId, reportId), eq(votes.tokenId, tokenId)))
      return row ? mapRow(row) : null
    },

    async deleteByReportAndToken(reportId: string, tokenId: string): Promise<void> {
      await db
        .delete(votes)
        .where(and(eq(votes.reportId, reportId), eq(votes.tokenId, tokenId)))
      await decrementVoteCount(db, reportId)
    },
  }
}

async function incrementVoteCount(db: Database, reportId: string) {
  const [row] = await db.select().from(reports).where(eq(reports.id, reportId))
  if (!row) return
  await db.update(reports).set({ votes: row.votes + 1 }).where(eq(reports.id, reportId))
}

async function decrementVoteCount(db: Database, reportId: string) {
  const [row] = await db.select().from(reports).where(eq(reports.id, reportId))
  if (!row || row.votes <= 0) return
  await db.update(reports).set({ votes: row.votes - 1 }).where(eq(reports.id, reportId))
}

function mapRow(row: typeof votes.$inferSelect): VoteRow {
  return {
    id: row.id,
    reportId: row.reportId,
    tokenId: row.tokenId,
    createdAt: row.createdAt,
  }
}
