import { describe, expect, it } from 'vitest'

import { hasPdfMetadata } from '../../src/domain/pdf-metadata-check'

function makePdf(content: string): ArrayBuffer {
  const full = `%PDF-1.4\n${content}\n%%EOF`
  return new TextEncoder().encode(full).buffer
}

describe('hasPdfMetadata', () => {
  it('returns false for clean PDF without metadata keys', () => {
    expect(hasPdfMetadata(makePdf('1 0 obj << /Type /Catalog >> endobj'))).toBe(false)
  })

  it('detects /Author with parenthesized value', () => {
    expect(hasPdfMetadata(makePdf('/Author (John Doe)'))).toBe(true)
  })

  it('detects /Creator with parenthesized value', () => {
    expect(hasPdfMetadata(makePdf('/Creator (Adobe Acrobat)'))).toBe(true)
  })

  it('detects /Producer with hex string value', () => {
    expect(hasPdfMetadata(makePdf('/Producer <4A6F686E>'))).toBe(true)
  })

  it('detects /Title with parenthesized value', () => {
    expect(hasPdfMetadata(makePdf('/Title (My Secret Doc)'))).toBe(true)
  })

  it('detects /Subject with parenthesized value', () => {
    expect(hasPdfMetadata(makePdf('/Subject (Confidential)'))).toBe(true)
  })

  it('detects /Keywords with parenthesized value', () => {
    expect(hasPdfMetadata(makePdf('/Keywords (secret, private)'))).toBe(true)
  })

  it('ignores empty parenthesized Author', () => {
    expect(hasPdfMetadata(makePdf('/Author ()'))).toBe(false)
  })

  it('ignores empty hex Author', () => {
    expect(hasPdfMetadata(makePdf('/Author <>'))).toBe(false)
  })

  it('returns false for non-PDF buffer', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer
    expect(hasPdfMetadata(png)).toBe(false)
  })

  it('returns false for empty buffer', () => {
    expect(hasPdfMetadata(new ArrayBuffer(0))).toBe(false)
  })
})
