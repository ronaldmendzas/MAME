import { describe, expect, it } from 'vitest'

import { createCryptoService } from '../../src/infrastructure/auth/crypto-service'

const TEST_MASTER_KEY = 'a'.repeat(128)
const TEST_RELATION_KEY = 'b'.repeat(128)

describe('CryptoService', () => {
  const service = createCryptoService(TEST_MASTER_KEY, TEST_RELATION_KEY)

  describe('hashEmail', () => {
    it('produces a hex hash from email', async () => {
      const hash = await service.hashEmail('test@example.com')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('normalizes email before hashing', async () => {
      const hash1 = await service.hashEmail('Test@Example.COM')
      const hash2 = await service.hashEmail('test@example.com')
      expect(hash1).toBe(hash2)
    })

    it('trims whitespace before hashing', async () => {
      const hash1 = await service.hashEmail('  test@example.com  ')
      const hash2 = await service.hashEmail('test@example.com')
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different emails', async () => {
      const hash1 = await service.hashEmail('a@test.com')
      const hash2 = await service.hashEmail('b@test.com')
      expect(hash1).not.toBe(hash2)
    })

    it('is deterministic — same input gives same output', async () => {
      const hash1 = await service.hashEmail('user@uni.edu')
      const hash2 = await service.hashEmail('user@uni.edu')
      expect(hash1).toBe(hash2)
    })
  })

  describe('generateRelationProof', () => {
    it('produces a hex string', async () => {
      const proof = await service.generateRelationProof('emailhash', 'tokenid')
      expect(proof).toMatch(/^[a-f0-9]{64}$/)
    })

    it('varies with different inputs', async () => {
      const proof1 = await service.generateRelationProof('hash1', 'token1')
      const proof2 = await service.generateRelationProof('hash2', 'token2')
      expect(proof1).not.toBe(proof2)
    })
  })

  describe('generateTokenId', () => {
    it('returns a valid UUID v4', () => {
      const uuid = service.generateTokenId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      expect(uuid).toMatch(uuidRegex)
    })

    it('generates unique tokens', () => {
      const ids = new Set(Array.from({ length: 100 }, () => service.generateTokenId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('generateDisplayName', () => {
    it('returns Adjective-Noun-NNNN format', () => {
      const name = service.generateDisplayName()
      expect(name).toMatch(/^[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$/)
    })

    it('generates varied names', () => {
      const names = new Set(Array.from({ length: 50 }, () => service.generateDisplayName()))
      expect(names.size).toBeGreaterThan(10)
    })
  })
})
