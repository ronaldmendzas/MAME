import { sql } from 'drizzle-orm'

import type { Database } from './connection'

export interface AdminStats {
  reportsByCategory: { category: string; count: number }[]
  reportsByMonth: { month: string; count: number }[]
  reportsByFaculty: { faculty: string; count: number }[]
  reportsByStatus: { status: string; count: number }[]
  averageModerationTimeMinutes: number | null
  totalReports: number
  totalVotes: number
  totalComments: number
  activeTokens: number
  suspendedTokens: number
}

export async function getAdminStats(db: Database): Promise<AdminStats> {
  const [
    reportsByCategory,
    reportsByMonth,
    reportsByFaculty,
    reportsByStatus,
    avgModTime,
    totals,
    tokens,
  ] = await Promise.all([
    db.execute<{ category: string; count: string }>(sql`
      SELECT category, COUNT(*)::text as count
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `),
    db.execute<{ month: string; count: string }>(sql`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month, COUNT(*)::text as count
      FROM reports
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `),
    db.execute<{ faculty: string; count: string }>(sql`
      SELECT faculty, COUNT(*)::text as count
      FROM reports
      GROUP BY faculty
      ORDER BY count DESC
      LIMIT 10
    `),
    db.execute<{ status: string; count: string }>(sql`
      SELECT status, COUNT(*)::text as count
      FROM reports
      GROUP BY status
      ORDER BY count DESC
    `),
    db.execute<{ avg_minutes: string | null }>(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (ml.created_at - r.created_at)) / 60)::text as avg_minutes
      FROM reports r
      JOIN moderation_log ml ON ml.report_id = r.id
      WHERE ml.action = 'approve'
    `),
    db.execute<{
      total_reports: string
      total_votes: string
      total_comments: string
    }>(sql`
      SELECT
        (SELECT COUNT(*)::text FROM reports) as total_reports,
        (SELECT COUNT(*)::text FROM votes) as total_votes,
        (SELECT COUNT(*)::text FROM comments) as total_comments
    `),
    db.execute<{
      active_tokens: string
      suspended_tokens: string
    }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE is_suspended = false)::text as active_tokens,
        COUNT(*) FILTER (WHERE is_suspended = true)::text as suspended_tokens
      FROM anonymous_profiles
    `),
  ])

  return {
    reportsByCategory: reportsByCategory.rows.map((r) => ({
      category: r.category,
      count: Number(r.count),
    })),
    reportsByMonth: reportsByMonth.rows.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
    reportsByFaculty: reportsByFaculty.rows.map((r) => ({
      faculty: r.faculty,
      count: Number(r.count),
    })),
    reportsByStatus: reportsByStatus.rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    averageModerationTimeMinutes: avgModTime.rows[0]?.avg_minutes
      ? Number(avgModTime.rows[0].avg_minutes)
      : null,
    totalReports: Number(totals.rows[0]?.total_reports ?? 0),
    totalVotes: Number(totals.rows[0]?.total_votes ?? 0),
    totalComments: Number(totals.rows[0]?.total_comments ?? 0),
    activeTokens: Number(tokens.rows[0]?.active_tokens ?? 0),
    suspendedTokens: Number(tokens.rows[0]?.suspended_tokens ?? 0),
  }
}
