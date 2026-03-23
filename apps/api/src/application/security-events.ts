import type { InsertSecurityEventData } from '../domain/ports/security-event-repository.js'
import type { AppEnv } from '../env.js'
import { createDb } from '../infrastructure/db/connection.js'
import { createSecurityEventRepository } from '../infrastructure/db/security-event-repository.js'

export async function recordSecurityEvent(
  env: AppEnv['Bindings'] | undefined,
  data: InsertSecurityEventData,
): Promise<void> {
  if (!env?.DATABASE_URL) return

  try {
    const db = createDb(env.DATABASE_URL)
    const repo = createSecurityEventRepository(db)
    await repo.insert(data)
  } catch {
    // Security logging must not break the request flow.
  }
}
