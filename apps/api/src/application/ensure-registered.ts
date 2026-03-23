import type { RegisterUserDeps } from './register-user.js'
import { registerUser } from './register-user.js'

export type EnsureRegisteredDeps = RegisterUserDeps

export async function ensureRegistered(
  clerkId: string,
  deps: EnsureRegisteredDeps,
): Promise<string> {
  const clerkUser = await deps.clerkService.getUser(clerkId)
  if (clerkUser.tokenId) {
    const profile = await deps.profileRepo.findByTokenId(clerkUser.tokenId)
    if (profile) return clerkUser.tokenId
    await ensureProfileExists(clerkUser.tokenId, deps)
    return clerkUser.tokenId
  }

  const user = await deps.userRepo.findByClerkId(clerkId)
  if (!user) return registerNewUser(clerkId, clerkUser.email, deps)

  return recoverTokenId(clerkId, user.emailHash, deps)
}

async function registerNewUser(
  clerkId: string,
  email: string,
  deps: EnsureRegisteredDeps,
): Promise<string> {
  try {
    const result = await registerUser({ clerkId, email }, deps)
    return result.tokenId
  } catch (error) {
    if (!isUniqueViolation(error)) throw error
    const clerkUser = await deps.clerkService.getUser(clerkId)
    if (clerkUser.tokenId) return clerkUser.tokenId

    const user = await deps.userRepo.findByClerkId(clerkId)
    if (!user) throw error
    return recoverTokenId(clerkId, user.emailHash, deps)
  }
}

async function recoverTokenId(
  clerkId: string,
  emailHash: string,
  deps: Pick<EnsureRegisteredDeps, 'linkRepo' | 'clerkService' | 'profileRepo' | 'cryptoService'>,
): Promise<string> {
  const link = await deps.linkRepo.findByEmailHash(emailHash)
  if (!link) throw new Error('Identity link missing — data inconsistency')

  await ensureProfileExists(link.tokenId, deps)

  await deps.clerkService.updateUserMetadata(clerkId, link.tokenId)
  return link.tokenId
}

async function ensureProfileExists(
  tokenId: string,
  deps: Pick<EnsureRegisteredDeps, 'profileRepo' | 'cryptoService'>,
) {
  const profile = await deps.profileRepo.findByTokenId(tokenId)
  if (profile) return

  const displayName = deps.cryptoService.generateDisplayName()
  await deps.profileRepo.insertProfile({ tokenId, displayName })
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return msg.includes('unique') || msg.includes('duplicate key')
}
