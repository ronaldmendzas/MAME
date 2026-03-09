import { describe, expect, it } from 'vitest'

import { computeContentHash } from '../../src/domain/content-hash'

describe('content-hash', () => {
  it('produces a 64-char hex string for text', async () => {
    const hash = await computeContentHash('test content')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces a 64-char hex string for ArrayBuffer', async () => {
    const buf = new Uint8Array([1, 2, 3]).buffer
    const hash = await computeContentHash(buf)
    expect(hash).toHaveLength(64)
  })

  it('returns same hash for same input', async () => {
    const a = await computeContentHash('hello')
    const b = await computeContentHash('hello')
    expect(a).toBe(b)
  })

  it('returns different hash for different input', async () => {
    const a = await computeContentHash('hello')
    const b = await computeContentHash('world')
    expect(a).not.toBe(b)
  })
})
