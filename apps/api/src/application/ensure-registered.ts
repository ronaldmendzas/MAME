import type { RegisterUserDeps } from './register-user.js'
import { registerUser } from './register-user.js'

export type EnsureRegisteredDeps = RegisterUserDeps

export async function ensureRegistered(
  clerkId: string,
  deps: EnsureRegisteredDeps,
): Promise<string> {
  const clerkUser = await deps.clerkService.getUser(clerkId)
  if (clerkUser.tokenId) return clerkUser.tokenId

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
  deps: Pick<EnsureRegisteredDeps, 'linkRepo' | 'clerkService'>,
): Promise<string> {
  const link = await deps.linkRepo.findByEmailHash(emailHash)
  if (!link) throw new Error('Identity link missing — data inconsistency')

  await deps.clerkService.updateUserMetadata(clerkId, link.tokenId)
  return link.tokenId
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return msg.includes('unique') || msg.includes('duplicate key')
}
