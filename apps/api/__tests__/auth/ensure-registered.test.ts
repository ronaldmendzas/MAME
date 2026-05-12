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
    expect(deps.linkRepo.findByEmailHash).not.toHaveBeenCalled()
  })

  it('registers new user when not in Clerk or DB', async () => {
    const deps = createMockDeps()

    const tokenId = await ensureRegistered('clerk_new', deps)

    expect(tokenId).toBe('new-token-uuid')
    expect(deps.clerkService.getUser).toHaveBeenCalledWith('clerk_new')
    expect(deps.userRepo.insertUser).toHaveBeenCalledOnce()
    expect(deps.profileRepo.insertProfile).toHaveBeenCalledOnce()
    expect(deps.linkRepo.insertLink).toHaveBeenCalledOnce()
    expect(deps.linkRepo.findByEmailHash).not.toHaveBeenCalled()
  })

  it('recovers tokenId from identity_links when Clerk metadata lost', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'user-1',
          clerkId: 'clerk_recover',
          emailHash: 'hash-recover',
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
        findByEmailHash: vi.fn().mockResolvedValue({
          tokenId: 'recovered-token',
        }),
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
        findByClerkId: vi.fn().mockResolvedValue(null),
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
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
      linkRepo: {
        insertLink: vi.fn(),
        findByEmailHash: vi.fn().mockResolvedValue(null),
      },
    })

    await expect(ensureRegistered('clerk_broken', deps)).rejects.toThrow('Identity link missing')
  })
})
