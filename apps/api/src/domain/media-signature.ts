const DEFAULT_EXPIRY_SECONDS = 3600

// eslint-disable-next-line max-params
export async function signMediaUrl(
  baseUrl: string,
  fileKey: string,
  secret: string,
  expirySec = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + expirySec
  const payload = `${fileKey}:${expires}`
  const signature = await hmacSign(payload, secret)
  const encoded = encodeURIComponent(fileKey)
  return `${baseUrl}/media/${encoded}?expires=${expires}&sig=${signature}`
}

// eslint-disable-next-line max-params
export async function verifyMediaSignature(
  fileKey: string,
  expires: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  if (parseInt(expires, 10) < now) return false

  const payload = `${fileKey}:${expires}`
  const expected = await hmacSign(payload, secret)
  return expected === signature
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
