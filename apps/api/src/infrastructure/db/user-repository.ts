import { eq } from 'drizzle-orm'

import type { UserRepository, UserRecord } from '../../domain/ports/user-repository'

import type { Database } from './connection'
import { users } from './schema/users'

export function createUserRepository(db: Database): UserRepository {
  return {
    findByClerkId: async (clerkId) => {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1)

      const row = rows[0]
      if (!row) return null
      return mapToRecord(row)
    },

    insertUser: async (data) => {
      const rows = await db
        .insert(users)
        .values({
          clerkId: data.clerkId,
          emailHash: data.emailHash,
          role: data.role,
        })
        .returning()

      const row = rows[0]
      if (!row) throw new Error('Insert user returned no rows')
      return mapToRecord(row)
    },
  }
}

function mapToRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    emailHash: row.emailHash,
    role: row.role,
    createdAt: row.createdAt,
  }
}
