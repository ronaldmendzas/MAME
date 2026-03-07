import { describe, expect, it } from 'vitest'

import { hasExifData } from '../../src/domain/exif-check.js'

function makeJpeg(markers: number[]): ArrayBuffer {
  const bytes = [0xff, 0xd8]
  for (const m of markers) {
    bytes.push(0xff, m, 0x00, 0x04, 0x00, 0x00)
  }
  bytes.push(0xff, 0xda)
  return new Uint8Array(bytes).buffer
}

describe('hasExifData', () => {
  it('returns true when EXIF marker present', () => {
    expect(hasExifData(makeJpeg([0xe1]))).toBe(true)
  })

  it('returns false when no EXIF marker', () => {
    expect(hasExifData(makeJpeg([0xe0]))).toBe(false)
  })

  it('returns false for non-JPEG', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer
    expect(hasExifData(png)).toBe(false)
  })
})
