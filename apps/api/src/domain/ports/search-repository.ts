import type { ReportRow } from './report-repository'

export interface SearchResult extends ReportRow {
  rank: number
}

export interface SearchRepository {
  search(query: string, limit: number, offset: number): Promise<SearchResult[]>
}
