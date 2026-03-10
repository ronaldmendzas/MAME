import { eq } from 'drizzle-orm'

import type { ProfileRepository, ProfileRecord } from '../../domain/ports/profile-repository'

import type { Database } from './connection'
import { anonymousProfiles } from './schema/users'

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    insertProfile: async (data) => {
      const rows = await db
        .insert(anonymousProfiles)
        .values({
          tokenId: data.tokenId,
          displayName: data.displayName,
        })
        .returning()

      const row = rows[0]
      if (!row) throw new Error('Insert profile returned no rows')
      return mapToRecord(row)
    },

    findByTokenId: async (tokenId) => {
      const rows = await db
        .select()
        .from(anonymousProfiles)
        .where(eq(anonymousProfiles.tokenId, tokenId))
        .limit(1)

      const row = rows[0]
      if (!row) return null
      return mapToRecord(row)
    },
  }
}

function mapToRecord(row: typeof anonymousProfiles.$inferSelect): ProfileRecord {
  return {
    tokenId: row.tokenId,
    displayName: row.displayName,
    reputationScore: row.reputationScore,
    isSuspended: row.isSuspended,
    createdAt: row.createdAt,
  }
}
