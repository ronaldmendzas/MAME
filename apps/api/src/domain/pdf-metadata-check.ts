const METADATA_KEYS = ['/Author', '/Creator', '/Producer', '/Title', '/Subject', '/Keywords']

export function hasPdfMetadata(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    return false
  }

  const text = new TextDecoder('latin1').decode(bytes)

  for (const key of METADATA_KEYS) {
    const idx = text.indexOf(key)
    if (idx === -1) continue

    const after = text.substring(idx + key.length, idx + key.length + 64).trimStart()
    if (after.startsWith('(') && !after.startsWith('()')) return true
    if (after.startsWith('<') && !after.startsWith('<>')) return true
  }

  return false
}
