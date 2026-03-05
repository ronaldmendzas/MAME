import { and, desc, eq, gte, lt, lte } from 'drizzle-orm'

import type { InsertReportData, ReportFilters, ReportRepository, ReportRow } from '../../domain/ports/report-repository'

import type { Database } from './connection'
import { reports } from './schema/reports'

export function createReportRepository(db: Database): ReportRepository {
  return {
    async insert(data: InsertReportData): Promise<ReportRow> {
      const [row] = await db.insert(reports).values(data).returning()
      return mapRow(row!)
    },

    async findById(id: string): Promise<ReportRow | null> {
      const [row] = await db.select().from(reports).where(eq(reports.id, id))
      return row ? mapRow(row) : null
    },

    async findPublished(
      cursor: string | null,
      limit: number,
      filters: ReportFilters,
    ): Promise<ReportRow[]> {
      const conditions = buildPublishedConditions(cursor, filters)
      const rows = await db
        .select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.publishedAt))
        .limit(limit)
      return rows.map(mapRow)
    },

    async findByTokenId(
      tokenId: string,
      cursor: string | null,
      limit: number,
    ): Promise<ReportRow[]> {
      const conditions = [eq(reports.tokenId, tokenId)]
      if (cursor) conditions.push(lt(reports.createdAt, new Date(cursor)))
      const rows = await db
        .select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
      return rows.map(mapRow)
    },

    async update(id: string, data): Promise<ReportRow> {
      const [row] = await db
        .update(reports)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(reports.id, id))
        .returning()
      return mapRow(row!)
    },
  }
}

function buildPublishedConditions(cursor: string | null, filters: ReportFilters) {
  const conditions = [eq(reports.status, 'published')]
  if (cursor) conditions.push(lt(reports.publishedAt, new Date(cursor)))
  if (filters.category) conditions.push(eq(reports.category, filters.category))
  if (filters.faculty) conditions.push(eq(reports.faculty, filters.faculty))
  if (filters.dateFrom) conditions.push(gte(reports.createdAt, filters.dateFrom))
  if (filters.dateTo) conditions.push(lte(reports.createdAt, filters.dateTo))
  return conditions
}

function mapRow(row: typeof reports.$inferSelect): ReportRow {
  return {
    id: row.id,
    tokenId: row.tokenId,
    title: row.title,
    body: row.body,
    category: row.category,
    faculty: row.faculty,
    status: row.status,
    votes: row.votes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  }
}
