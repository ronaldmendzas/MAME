import type { ClerkService } from '../domain/ports/clerk-service'
import type { CryptoService } from '../domain/ports/crypto-service'
import type { IdentityLinkRepository } from '../domain/ports/identity-link-repository'
import type { ProfileRepository } from '../domain/ports/profile-repository'
import type { UserRepository } from '../domain/ports/user-repository'

export interface RegisterUserInput {
  clerkId: string
  email: string
}

export interface RegisterUserResult {
  userId: string
  tokenId: string
  isNew: boolean
}

export interface RegisterUserDeps {
  userRepo: UserRepository
  profileRepo: ProfileRepository
  linkRepo: IdentityLinkRepository
  cryptoService: CryptoService
  clerkService: ClerkService
}

export async function registerUser(
  input: RegisterUserInput,
  deps: RegisterUserDeps,
): Promise<RegisterUserResult> {
  const existing = await deps.userRepo.findByClerkId(input.clerkId)
  if (existing) {
    return { userId: existing.id, tokenId: '', isNew: false }
  }

  const emailHash = await deps.cryptoService.hashEmail(input.email)
  const tokenId = deps.cryptoService.generateTokenId()
  const displayName = deps.cryptoService.generateDisplayName()

  const relationProof = await deps.cryptoService.generateRelationProof(emailHash, tokenId)

  const user = await deps.userRepo.insertUser({
    clerkId: input.clerkId,
    emailHash,
    role: 'user',
  })

  await deps.profileRepo.insertProfile({ tokenId, displayName })

  await deps.linkRepo.insertLink({ emailHash, tokenId, relationProof })

  await deps.clerkService.updateUserMetadata(input.clerkId, tokenId)

  return { userId: user.id, tokenId, isNew: true }
}
