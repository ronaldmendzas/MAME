import type { Context, Next } from 'hono'

import { ForbiddenError, UnauthorizedError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createProfileRepository } from '../../infrastructure/db/profile-repository.js'

export async function ensureRegisteredMiddleware(c: Context<AppEnv>, next: Next) {
  const tokenId = c.get('tokenId')
  if (!tokenId) {
    throw new UnauthorizedError('Missing token_id in JWT')
  }

  const db = createDb(c.env.DATABASE_URL)
  const profileRepo = createProfileRepository(db)
  const profile = await profileRepo.findByTokenId(tokenId)

  if (!profile) {
    throw new ForbiddenError('Anonymous profile is not registered')
  }

  if (profile.isSuspended) {
    throw new ForbiddenError('Account suspended')
  }

  await next()
}
