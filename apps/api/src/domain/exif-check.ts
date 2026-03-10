const EXIF_MARKER = 0xe1

export function hasExifData(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return false

  let offset = 2
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]!
    if (marker === EXIF_MARKER) return true
    if (marker === 0xda) break
    const segLen = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
    offset += 2 + segLen
  }

  return false
}
