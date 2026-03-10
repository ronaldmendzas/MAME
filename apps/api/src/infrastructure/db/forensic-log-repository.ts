import type { ForensicEntry, ForensicLogPort } from '../../domain/ports/forensic-log-port'
import type { Database } from './connection'
import { moderationLog } from './schema/moderation'

export function createForensicLogRepository(db: Database): ForensicLogPort {
  return {
    async logRejection(entry: ForensicEntry): Promise<void> {
      const reason = formatReason(entry)
      await db.insert(moderationLog).values({
        reportId: entry.reportId,
        moderatorToken: entry.tokenId,
        action: 'reject',
        reason,
      })
    },
  }
}

function formatReason(entry: ForensicEntry): string {
  return [
    `[AI-AUTO] ${entry.rejectionReason}`,
    `confidence=${entry.aiConfidence}`,
    `hash=${entry.contentHash}`,
  ].join(' | ')
}
