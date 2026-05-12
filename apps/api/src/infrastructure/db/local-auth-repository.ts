import { eq } from 'drizzle-orm'

import type {
  LocalAuthCredential,
  LocalAuthRepository,
} from '../../domain/ports/local-auth-repository'

import type { Database } from './connection'
import { localAuthCredentials } from './schema/local-auth'

export function createLocalAuthRepository(db: Database): LocalAuthRepository {
  return {
    findByLoginHash: async (loginHash) => {
      const rows = await db
        .select()
        .from(localAuthCredentials)
        .where(eq(localAuthCredentials.loginHash, loginHash))
        .limit(1)
      const row = rows[0]
      if (!row) return null
      return mapCredential(row)
    },

    findByUserId: async (userId) => {
      const rows = await db
        .select()
        .from(localAuthCredentials)
        .where(eq(localAuthCredentials.userId, userId))
        .limit(1)
      const row = rows[0]
      if (!row) return null
      return mapCredential(row)
    },

    insertCredential: async (data) => {
      const rows = await db.insert(localAuthCredentials).values(data).returning()
      const row = rows[0]
      if (!row) throw new Error('Insert local auth credential returned no rows')
      return mapCredential(row)
    },

    setFailedAttempts: async (userId, attempts, lockedUntil) => {
      await db
        .update(localAuthCredentials)
        .set({ failedAttempts: attempts, lockedUntil, updatedAt: new Date() })
        .where(eq(localAuthCredentials.userId, userId))
    },

    setMfaState: async (userId, enabled, secretCiphertext) => {
      await db
        .update(localAuthCredentials)
        .set({ mfaEnabled: enabled, mfaSecretCiphertext: secretCiphertext, updatedAt: new Date() })
        .where(eq(localAuthCredentials.userId, userId))
    },
  }
}

function mapCredential(row: typeof localAuthCredentials.$inferSelect): LocalAuthCredential {
  return {
    userId: row.userId,
    loginHash: row.loginHash,
    passwordHash: row.passwordHash,
    passwordAlgo: row.passwordAlgo,
    failedAttempts: row.failedAttempts,
    lockedUntil: row.lockedUntil,
    mfaSecretCiphertext: row.mfaSecretCiphertext,
    mfaEnabled: row.mfaEnabled,
    createdAt: row.createdAt,
  }
}
