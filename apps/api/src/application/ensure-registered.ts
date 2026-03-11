import type { RegisterUserDeps } from './register-user.js'
import { registerUser } from './register-user.js'

export type EnsureRegisteredDeps = RegisterUserDeps

export async function ensureRegistered(
  clerkId: string,
  deps: EnsureRegisteredDeps,
): Promise<string> {
  const existing = await findExistingTokenId(clerkId, deps)
  if (existing) {
    await deps.clerkService.updateUserMetadata(clerkId, existing)
    return existing
  }

  const clerkUser = await deps.clerkService.getUser(clerkId)
  const result = await registerUser(
    { clerkId, email: clerkUser.email },
    deps,
  )

  return result.tokenId
}

async function findExistingTokenId(
  clerkId: string,
  deps: Pick<EnsureRegisteredDeps, 'userRepo' | 'linkRepo'>,
): Promise<string | null> {
  const user = await deps.userRepo.findByClerkId(clerkId)
  if (!user) return null

  const link = await deps.linkRepo.findByEmailHash(user.emailHash)
  return link?.tokenId ?? null
}
