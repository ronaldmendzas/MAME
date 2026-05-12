import { eq } from 'drizzle-orm'

import type {
  EvidenceRepository,
  EvidenceRow,
  InsertEvidenceData,
} from '../../domain/ports/evidence-repository.js'

import type { Database } from './connection.js'
import { evidence } from './schema/evidence.js'

function mapRow(row: typeof evidence.$inferSelect): EvidenceRow {
  return {
    id: row.id,
    reportId: row.reportId,
    type: row.type as EvidenceRow['type'],
    fileKey: row.fileKey,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
  }
}

export function createEvidenceRepository(db: Database): EvidenceRepository {
  return {
    async insert(data: InsertEvidenceData): Promise<EvidenceRow> {
      const [row] = await db
        .insert(evidence)
        .values({
          reportId: data.reportId,
          type: data.type,
          fileKey: data.fileKey,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
        })
        .returning()

      return mapRow(row!)
    },

    async findByReportId(reportId: string): Promise<EvidenceRow[]> {
      const rows = await db.select().from(evidence).where(eq(evidence.reportId, reportId))
      return rows.map(mapRow)
    },
  }
}
