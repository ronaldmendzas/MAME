import { describe, expect, it, vi } from 'vitest'

import { registerUser } from '../../src/application/register-user'
import type { RegisterUserDeps } from '../../src/application/register-user'

function createMockDeps(overrides?: Partial<RegisterUserDeps>): RegisterUserDeps {
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
        tokenId: 'token-uuid',
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
      generateTokenId: vi.fn().mockReturnValue('token-uuid'),
      generateDisplayName: vi.fn().mockReturnValue('Brave-Citizen-1234'),
    },
    clerkService: {
      updateUserMetadata: vi.fn().mockResolvedValue(undefined),
      getUser: vi.fn().mockResolvedValue({ email: 'test@uni.edu' }),
    },
    ...overrides,
  }
}

describe('registerUser', () => {
  it('creates user, profile, identity link for new user', async () => {
    const deps = createMockDeps()
    const result = await registerUser({ clerkId: 'clerk_123', email: 'test@uni.edu' }, deps)

    expect(result.isNew).toBe(true)
    expect(result.userId).toBe('user-uuid')
    expect(result.tokenId).toBe('token-uuid')
    expect(deps.userRepo.insertUser).toHaveBeenCalledOnce()
    expect(deps.profileRepo.insertProfile).toHaveBeenCalledOnce()
    expect(deps.linkRepo.insertLink).toHaveBeenCalledOnce()
    expect(deps.clerkService.updateUserMetadata).toHaveBeenCalledWith('clerk_123', 'token-uuid')
  })

  it('hashes email, never stores plaintext', async () => {
    const deps = createMockDeps()
    await registerUser({ clerkId: 'clerk_123', email: 'student@university.edu' }, deps)

    expect(deps.cryptoService.hashEmail).toHaveBeenCalledWith('student@university.edu')
    const insertCall = vi.mocked(deps.userRepo.insertUser).mock.calls[0]?.[0]
    expect(insertCall?.emailHash).toBe('abcdef1234567890')
    expect(JSON.stringify(insertCall)).not.toContain('student@university.edu')
  })

  it('generates relation proof from emailHash + tokenId', async () => {
    const deps = createMockDeps()
    await registerUser({ clerkId: 'clerk_123', email: 'test@uni.edu' }, deps)

    expect(deps.cryptoService.generateRelationProof).toHaveBeenCalledWith(
      'abcdef1234567890',
      'token-uuid',
    )
  })

  it('stores token_id in Clerk publicMetadata', async () => {
    const deps = createMockDeps()
    await registerUser({ clerkId: 'clerk_123', email: 'test@uni.edu' }, deps)

    expect(deps.clerkService.updateUserMetadata).toHaveBeenCalledWith('clerk_123', 'token-uuid')
  })

  it('returns existing user without creating duplicates (idempotent)', async () => {
    const deps = createMockDeps({
      userRepo: {
        findByClerkId: vi.fn().mockResolvedValue({
          id: 'existing-user',
          clerkId: 'clerk_123',
          emailHash: 'hashed',
          role: 'user',
          createdAt: new Date(),
        }),
        insertUser: vi.fn(),
      },
    })

    const result = await registerUser({ clerkId: 'clerk_123', email: 'test@uni.edu' }, deps)

    expect(result.isNew).toBe(false)
    expect(result.userId).toBe('existing-user')
    expect(deps.userRepo.insertUser).not.toHaveBeenCalled()
    expect(deps.profileRepo.insertProfile).not.toHaveBeenCalled()
  })
})
