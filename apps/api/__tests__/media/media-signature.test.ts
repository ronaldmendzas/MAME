import { describe, expect, it } from 'vitest'

import { signMediaUrl, verifyMediaSignature } from '../../src/domain/media-signature'

const SECRET = 'test-secret-key-for-signing'

describe('signMediaUrl', () => {
  it('generates a signed URL with expires and sig params', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET)
    expect(url).toContain('https://api.test/media/evidence%2Fabc')
    expect(url).toContain('expires=')
    expect(url).toContain('sig=')
  })

  it('encodes special characters in file key', async () => {
    const url = await signMediaUrl('https://api.test', 'path/with spaces', SECRET)
    expect(url).toContain('path%2Fwith%20spaces')
  })
})

describe('verifyMediaSignature', () => {
  it('verifies a valid signature', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    const valid = await verifyMediaSignature('evidence/abc', expires, sig, SECRET)
    expect(valid).toBe(true)
  })

  it('rejects an expired signature', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET, -1)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    const valid = await verifyMediaSignature('evidence/abc', expires, sig, SECRET)
    expect(valid).toBe(false)
  })

  it('rejects a tampered signature', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!

    const valid = await verifyMediaSignature('evidence/abc', expires, 'tampered', SECRET)
    expect(valid).toBe(false)
  })

  it('rejects a different file key', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    const valid = await verifyMediaSignature('evidence/xyz', expires, sig, SECRET)
    expect(valid).toBe(false)
  })

  it('rejects a different secret', async () => {
    const url = await signMediaUrl('https://api.test', 'evidence/abc', SECRET)
    const parsed = new URL(url)
    const expires = parsed.searchParams.get('expires')!
    const sig = parsed.searchParams.get('sig')!

    const valid = await verifyMediaSignature('evidence/abc', expires, sig, 'wrong-secret')
    expect(valid).toBe(false)
  })
})
