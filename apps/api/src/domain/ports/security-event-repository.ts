export type SecurityEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'access_denied'
  | 'sensitive_endpoint_attempt'

export type SecurityEventOutcome = 'allowed' | 'denied' | 'error'

export interface SecurityEventRow {
  id: string
  eventType: SecurityEventType
  outcome: SecurityEventOutcome
  actorToken: string | null
  actorRole: string | null
  source: string
  target: string | null
  details: Record<string, unknown>
  createdAt: Date
}

export interface InsertSecurityEventData {
  eventType: SecurityEventType
  outcome: SecurityEventOutcome
  actorToken?: string | null
  actorRole?: string | null
  source: string
  target?: string | null
  details?: Record<string, unknown>
}

export interface SecurityEventRepository {
  insert(data: InsertSecurityEventData): Promise<SecurityEventRow>
  findRecent(limit: number): Promise<SecurityEventRow[]>
}
