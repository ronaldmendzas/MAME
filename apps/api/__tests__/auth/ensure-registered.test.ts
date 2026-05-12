import { describe, expect, it, vi } from 'vitest'

import { ensureRegistered } from '../../src/application/ensure-registered'
import type { EnsureRegisteredDeps } from '../../src/application/ensure-registered'

function createMockDeps(overrides?: Partial<EnsureRegisteredDeps>): EnsureRegisteredDeps {
  return {
    userRepo: {
      findByClerkId: vi.fn().mockResolvedValue(null),
      insertUser: vi.fn().mockResolvedValue({
        id: 'user-uuid',
        clerkId: 'clerk_123',
        emailHash: 'hashed',
        anonymousTokenId: 'new-token-uuid',
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
  it('returns tokenId from Clerk metadata without DB queries', async () => {
    const deps = createMockDeps({
      clerkService: {
        updateUserMetadata: vi.fn(),
        getUser: vi.fn().mockResolvedValue({
          email: 'test@uni.edu',
          tokenId: 'clerk-token',
        }),
      },
    })

    const tokenId = await ensureRegistered('clerk_123', deps)

    expect(tokenId).toBe('clerk-token')
    expect(deps.userRepo.findByClerkId).not.toHaveBeenCalled()
  })

  it('registers new user when not in Clerk or DB', async () => {
    const deps = createMockDeps()

    const tokenId = await ensureRegistered('clerk_new', deps)

    expect(tokenId).toBe('new-token-uuid')
    expect(deps.clerkService.getUser).toHaveBeenCalledWith('clerk_new')
    expect(deps.userRepo.insertUser).toHaveBeenCalledOnce()
    expect(deps.profileRepo.insertProfile).toHaveBeenCalledOnce()
    expect(deps.linkRepo.insertLink).toHaveBeenCalledOnce()
  })

  it('recovers tokenId from user.anonymousTokenId when Clerk metadata lost', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'user-1',
          clerkId: 'clerk_recover',
          emailHash: 'hash-recover',
          anonymousTokenId: 'recovered-token',
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
      },
    })

    const tokenId = await ensureRegistered('clerk_recover', deps)

    expect(tokenId).toBe('recovered-token')
    expect(deps.clerkService.updateUserMetadata).toHaveBeenCalledWith(
      'clerk_recover',
      'recovered-token',
    )
  })

  it('handles race condition on concurrent registration', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'user-1',
            clerkId: 'clerk_race',
            emailHash: 'hash-race',
            anonymousTokenId: 'race-token',
            role: 'user',
            createdAt: new Date(),
          }),
        insertUser: vi
          .fn()
          .mockRejectedValue(new Error('duplicate key value violates unique constraint')),
      },
      clerkService: {
        updateUserMetadata: vi.fn(),
        getUser: vi
          .fn()
          .mockResolvedValueOnce({ email: 'test@uni.edu' })
          .mockResolvedValueOnce({ email: 'test@uni.edu', tokenId: 'race-token' }),
      },
    })

    const tokenId = await ensureRegistered('clerk_race', deps)

    expect(tokenId).toBe('race-token')
    expect(deps.clerkService.getUser).toHaveBeenCalledTimes(2)
  })

  it('throws on data inconsistency during recovery', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'user-1',
          clerkId: 'clerk_broken',
          emailHash: 'hash-broken',
          anonymousTokenId: null,
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
      },
    })

    await expect(ensureRegistered('clerk_broken', deps)).rejects.toThrow(
      'User missing anonymous token',
    )
  })
})
