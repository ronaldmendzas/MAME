import { desc } from 'drizzle-orm'

import type {
  InsertSecurityEventData,
  SecurityEventRepository,
  SecurityEventRow,
} from '../../domain/ports/security-event-repository'

import type { Database } from './connection'
import { securityEventLog } from './schema/security'

export function createSecurityEventRepository(db: Database): SecurityEventRepository {
  return {
    async insert(data: InsertSecurityEventData): Promise<SecurityEventRow> {
      const [row] = await db
        .insert(securityEventLog)
        .values({
          ...data,
          details: data.details ?? {},
          actorToken: data.actorToken ?? null,
          actorRole: data.actorRole ?? null,
          target: data.target ?? null,
        })
        .returning()

      return mapRow(row!)
    },

    async findRecent(limit: number): Promise<SecurityEventRow[]> {
      const rows = await db
        .select()
        .from(securityEventLog)
        .orderBy(desc(securityEventLog.createdAt))
        .limit(limit)

      return rows.map(mapRow)
    },
  }
}

function mapRow(row: typeof securityEventLog.$inferSelect): SecurityEventRow {
  return {
    id: row.id,
    eventType: row.eventType,
    outcome: row.outcome,
    actorToken: row.actorToken,
    actorRole: row.actorRole,
    source: row.source,
    target: row.target,
    details: (row.details as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
  }
}
