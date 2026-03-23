import type { Context, Next } from 'hono'

import { ForbiddenError } from '../../domain/errors.js'
import { ensureRegistered } from '../../application/ensure-registered.js'
import type { AppEnv } from '../../env.js'
import { createClerkService } from '../../infrastructure/auth/clerk-service.js'
import { createCryptoService } from '../../infrastructure/auth/crypto-service.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createIdentityLinkRepository } from '../../infrastructure/db/identity-link-repository.js'
import { createProfileRepository } from '../../infrastructure/db/profile-repository.js'
import { createUserRepository } from '../../infrastructure/db/user-repository.js'

export async function ensureRegisteredMiddleware(
  c: Context<AppEnv>,
  next: Next,
) {
  const userId = c.get('userId')
  if (!userId) return next()

  const db = createDb(c.env.DATABASE_URL)
  const profileRepo = createProfileRepository(db)
  const userRepo = createUserRepository(db)
  const linkRepo = createIdentityLinkRepository(db)
  const clerkService = createClerkService(c.env.CLERK_SECRET_KEY)

  const tokenId = c.get('tokenId')
  if (tokenId) {
    const profile = await profileRepo.findByTokenId(tokenId)
    if (profile) {
      if (profile.isSuspended) throw new ForbiddenError('Account suspended')
      return next()
    }
  }

  const tokenFromDb = await resolveTokenIdFromDatabase(userId, userRepo, linkRepo)
  if (tokenFromDb) {
    const profile = await profileRepo.findByTokenId(tokenFromDb)
    if (profile) {
      if (profile.isSuspended) throw new ForbiddenError('Account suspended')
      await clerkService.updateUserMetadata(userId, tokenFromDb)
      c.set('tokenId', tokenFromDb)
      return next()
    }
  }

  const resolved = await ensureRegistered(userId, {
    userRepo: createUserRepository(db),
    profileRepo,
    linkRepo,
    cryptoService: createCryptoService(
      c.env.ENCRYPTION_MASTER_KEY,
      c.env.ENCRYPTION_RELATION_KEY,
    ),
    clerkService,
  })

  const profile = await profileRepo.findByTokenId(resolved)
  if (profile?.isSuspended) {
    throw new ForbiddenError('Account suspended')
  }

  if (!profile) {
    throw new ForbiddenError('Account profile missing, please sign out and sign in again')
  }

  c.set('tokenId', resolved)
  await next()
}

async function resolveTokenIdFromDatabase(
  clerkId: string,
  userRepo: ReturnType<typeof createUserRepository>,
  linkRepo: ReturnType<typeof createIdentityLinkRepository>,
): Promise<string | null> {
  const user = await userRepo.findByClerkId(clerkId)
  if (!user) return null

  const link = await linkRepo.findByEmailHash(user.emailHash)
  return link?.tokenId ?? null
}
