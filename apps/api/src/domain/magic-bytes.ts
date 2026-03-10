const SIGNATURES: [string, number[]][] = [
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]],
  ['application/pdf', [0x25, 0x50, 0x44, 0x46]],
]

const MP4_FTYP = [0x66, 0x74, 0x79, 0x70]

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
])

export function detectMimeType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 12))

  for (const [mime, sig] of SIGNATURES) {
    if (sig.every((b, i) => bytes[i] === b)) return mime
  }

  if (bytes.length >= 8 && MP4_FTYP.every((b, i) => bytes[4 + i] === b)) {
    return 'video/mp4'
  }

  if (bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3)) {
    return 'audio/mpeg'
  }

  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return 'audio/mpeg'
  }

  return null
}

export function isAllowedType(mime: string): boolean {
  return ALLOWED_TYPES.has(mime)
}
