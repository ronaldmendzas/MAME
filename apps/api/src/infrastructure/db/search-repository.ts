import { sql } from 'drizzle-orm'

import type { SearchRepository, SearchResult } from '../../domain/ports/search-repository'

import type { Database } from './connection'
import { reports } from './schema/reports'

export function createSearchRepository(db: Database): SearchRepository {
  return {
    async search(query, limit, offset): Promise<SearchResult[]> {
      const tsQuery = sql`plainto_tsquery('spanish', ${query})`
      const rows = await db
        .select({
          id: reports.id,
          tokenId: reports.tokenId,
          title: reports.title,
          body: reports.body,
          category: reports.category,
          faculty: reports.faculty,
          status: reports.status,
          votes: reports.votes,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
          publishedAt: reports.publishedAt,
          rank: sql<number>`ts_rank(${reports.searchVector}, ${tsQuery})`,
        })
        .from(reports)
        .where(sql`${reports.searchVector} @@ ${tsQuery}`)
        .orderBy(sql`ts_rank(${reports.searchVector}, ${tsQuery}) DESC`)
        .limit(limit)
        .offset(offset)

      return rows.map(mapToSearchResult)
    },
  }
}

function mapToSearchResult(row: Record<string, unknown>): SearchResult {
  return {
    id: row['id'] as string,
    tokenId: row['tokenId'] as string,
    title: row['title'] as string,
    body: row['body'] as string,
    category: row['category'] as SearchResult['category'],
    faculty: row['faculty'] as string,
    status: row['status'] as SearchResult['status'],
    votes: row['votes'] as number,
    createdAt: row['createdAt'] as Date,
    updatedAt: row['updatedAt'] as Date,
    publishedAt: row['publishedAt'] as Date | null,
    rank: Number(row['rank']),
  }
}
