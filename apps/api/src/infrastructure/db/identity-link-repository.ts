import type { IdentityLinkRepository, InsertLinkData } from '../../domain/ports/identity-link-repository'
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
  }
}
