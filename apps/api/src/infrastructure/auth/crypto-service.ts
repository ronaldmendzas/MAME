import type { CryptoService } from '../../domain/ports/crypto-service'

const ADJECTIVES = [
  'Brave',
  'Silent',
  'Wise',
  'Bold',
  'Free',
  'Noble',
  'Swift',
  'Calm',
  'Just',
  'True',
]

const NOUNS = [
  'Citizen',
  'Guardian',
  'Voice',
  'Shield',
  'Beacon',
  'Sentinel',
  'Herald',
  'Watcher',
  'Seeker',
  'Witness',
]

export function createCryptoService(masterKey: string, relationKey: string): CryptoService {
  return {
    hashEmail: (email) => hmacSha256(normalize(email), masterKey),
    generateRelationProof: (emailHash, tokenId) => hmacSha256(emailHash + tokenId, relationKey),
    generateTokenId: () => crypto.randomUUID(),
    generateDisplayName: () => buildDisplayName(),
  }
}

function normalize(email: string): string {
  return email.toLowerCase().trim()
}

async function hmacSha256(data: string, hexKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyBytes = hexToBytes(hexKey)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return bytesToHex(new Uint8Array(sig))
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function buildDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${adj}-${noun}-${num}`
}
