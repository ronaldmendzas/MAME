import type { Context, Next } from 'hono'

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
  const tokenId = c.get('tokenId')
  if (tokenId) return next()

  const userId = c.get('userId')
  if (!userId) return next()

  const db = createDb(c.env.DATABASE_URL)
  const resolved = await ensureRegistered(userId, {
    userRepo: createUserRepository(db),
    profileRepo: createProfileRepository(db),
    linkRepo: createIdentityLinkRepository(db),
    cryptoService: createCryptoService(
      c.env.ENCRYPTION_MASTER_KEY,
      c.env.ENCRYPTION_RELATION_KEY,
    ),
    clerkService: createClerkService(c.env.CLERK_SECRET_KEY),
  })

  c.set('tokenId', resolved)
  await next()
}
