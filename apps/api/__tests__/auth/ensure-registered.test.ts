import { describe, expect, it, vi } from 'vitest'

import { ensureRegistered } from '../../src/application/ensure-registered'
import type { EnsureRegisteredDeps } from '../../src/application/ensure-registered'

function createMockDeps(
  overrides?: Partial<EnsureRegisteredDeps>,
): EnsureRegisteredDeps {
  return {
    userRepo: {
      findByClerkId: vi.fn().mockResolvedValue(null),
      insertUser: vi.fn().mockResolvedValue({
        id: 'user-uuid',
        clerkId: 'clerk_123',
        emailHash: 'hashed',
        role: 'user',
        createdAt: new Date(),
      }),
    },
    profileRepo: {
      insertProfile: vi.fn().mockResolvedValue({
        tokenId: 'new-token-uuid',
        displayName: 'Brave-Citizen-1234',
        reputationScore: 0,
        isSuspended: false,
        createdAt: new Date(),
      }),
      findByTokenId: vi.fn().mockResolvedValue(null),
    },
    linkRepo: {
      insertLink: vi.fn().mockResolvedValue(undefined),
      findByEmailHash: vi.fn().mockResolvedValue(null),
    },
    cryptoService: {
      hashEmail: vi.fn().mockResolvedValue('abcdef1234567890'),
      generateRelationProof: vi.fn().mockResolvedValue('proof123'),
      generateTokenId: vi.fn().mockReturnValue('new-token-uuid'),
      generateDisplayName: vi.fn().mockReturnValue('Brave-Citizen-1234'),
    },
    clerkService: {
      updateUserMetadata: vi.fn().mockResolvedValue(undefined),
      getUser: vi.fn().mockResolvedValue({ email: 'test@uni.edu' }),
    },
    ...overrides,
  }
}

describe('ensureRegistered', () => {
  it('returns existing tokenId when user is already registered', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'existing-user',
          clerkId: 'clerk_123',
          emailHash: 'hashed-email',
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
        findByEmailHash: vi.fn().mockResolvedValue({
          tokenId: 'existing-token',
        }),
      },
    })

    const tokenId = await ensureRegistered('clerk_123', deps)

    expect(tokenId).toBe('existing-token')
    expect(deps.clerkService.updateUserMetadata).toHaveBeenCalledWith(
      'clerk_123',
      'existing-token',
    )
    expect(deps.clerkService.getUser).not.toHaveBeenCalled()
    expect(deps.userRepo.insertUser).not.toHaveBeenCalled()
  })

  it('registers new user when not found in database', async () => {
    const deps = createMockDeps()

    const tokenId = await ensureRegistered('clerk_new', deps)

    expect(tokenId).toBe('new-token-uuid')
    expect(deps.clerkService.getUser).toHaveBeenCalledWith('clerk_new')
    expect(deps.userRepo.insertUser).toHaveBeenCalledOnce()
    expect(deps.profileRepo.insertProfile).toHaveBeenCalledOnce()
    expect(deps.linkRepo.insertLink).toHaveBeenCalledOnce()
  })

  it('syncs Clerk metadata for existing user', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'user-1',
          clerkId: 'clerk_sync',
          emailHash: 'hash-sync',
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
        findByEmailHash: vi.fn().mockResolvedValue({
          tokenId: 'sync-token',
        }),
      },
    })

    await ensureRegistered('clerk_sync', deps)

    expect(deps.clerkService.updateUserMetadata).toHaveBeenCalledWith(
      'clerk_sync',
      'sync-token',
    )
  })
})
