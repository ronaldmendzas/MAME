import { eq } from 'drizzle-orm'

import type { IdentityLinkRepository } from '../../domain/ports/identity-link-repository'

import type { Database } from './connection'
import { identityLinks } from './schema/users'

export function createIdentityLinkRepository(db: Database): IdentityLinkRepository {
  return {
    insertLink: async (data) => {
      await db.insert(identityLinks).values({
        emailHash: data.emailHash,
        tokenId: data.tokenId,
        relationProof: data.relationProof,
      })
    },

    findByEmailHash: async (emailHash) => {
      const rows = await db
        .select({ tokenId: identityLinks.tokenId })
        .from(identityLinks)
        .where(eq(identityLinks.emailHash, emailHash))
        .limit(1)

      return rows[0] ?? null
    },
  }
}
