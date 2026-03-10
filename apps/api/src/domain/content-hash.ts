export async function computeContentHash(data: ArrayBuffer | string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = typeof data === 'string' ? encoder.encode(data) : data
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return bufferToHex(hash)
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
