import { describe, expect, it } from 'vitest'

import { detectMimeType, isAllowedType } from '../../src/domain/magic-bytes.js'

function makeBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}

describe('detectMimeType', () => {
  it('detects JPEG', () => {
    expect(detectMimeType(makeBuffer([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
  })

  it('detects PNG', () => {
    expect(detectMimeType(makeBuffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe('image/png')
  })

  it('detects WebP', () => {
    expect(detectMimeType(makeBuffer([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0]))).toBe('image/webp')
  })

  it('detects PDF', () => {
    expect(detectMimeType(makeBuffer([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe('application/pdf')
  })

  it('detects MP4', () => {
    const bytes = [0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]
    expect(detectMimeType(makeBuffer(bytes))).toBe('video/mp4')
  })

  it('detects MP3 with sync word', () => {
    expect(detectMimeType(makeBuffer([0xff, 0xfb, 0x90, 0x00]))).toBe('audio/mpeg')
  })

  it('detects MP3 with ID3 tag', () => {
    expect(detectMimeType(makeBuffer([0x49, 0x44, 0x33, 0x04]))).toBe('audio/mpeg')
  })

  it('returns null for unknown bytes', () => {
    expect(detectMimeType(makeBuffer([0x00, 0x00, 0x00, 0x00]))).toBeNull()
  })
})

describe('isAllowedType', () => {
  it('allows image/jpeg', () => expect(isAllowedType('image/jpeg')).toBe(true))
  it('allows video/mp4', () => expect(isAllowedType('video/mp4')).toBe(true))
  it('rejects text/html', () => expect(isAllowedType('text/html')).toBe(false))
})
