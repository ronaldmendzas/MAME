import type { EvidenceType } from '../types.js'

export interface EvidenceRow {
  id: string
  reportId: string
  type: EvidenceType
  fileKey: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

export interface InsertEvidenceData {
  reportId: string
  type: EvidenceType
  fileKey: string
  mimeType: string
  sizeBytes: number
}

export interface EvidenceRepository {
  insert(data: InsertEvidenceData): Promise<EvidenceRow>
  findByReportId(reportId: string): Promise<EvidenceRow[]>
}
