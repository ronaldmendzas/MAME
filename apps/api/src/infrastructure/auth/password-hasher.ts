import type { PasswordHasher } from '../../domain/ports/password-hasher.js'

const KEY_DERIVATION_ITERATIONS = 210000
const DERIVED_KEY_BITS = 256
const SALT_BYTES = 16
const HASH_PREFIX = 'pbkdf2$sha256'

export function createPasswordHasher(): PasswordHasher {
  return {
    hashPassword: async (password) => {
      const normalized = password.normalize('NFKC')
      const salt = randomBytes(SALT_BYTES)
      const hashBytes = await derivePbkdf2(normalized, salt, KEY_DERIVATION_ITERATIONS)
      return `${HASH_PREFIX}$${KEY_DERIVATION_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hashBytes)}`
    },

    verifyPassword: async (password, encodedHash) => {
      const parsed = parseEncodedHash(encodedHash)
      if (!parsed) return false

      const normalized = password.normalize('NFKC')
      const expected = await derivePbkdf2(normalized, parsed.salt, parsed.iterations)
      return constantTimeEquals(expected, parsed.hash)
    },
  }
}

async function derivePbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const imported = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    imported,
    DERIVED_KEY_BITS,
  )

  return new Uint8Array(bits)
}

function parseEncodedHash(encodedHash: string): { iterations: number; salt: Uint8Array; hash: Uint8Array } | null {
  const [prefix, algo, rounds, salt, hash] = encodedHash.split('$')
  if (`${prefix}$${algo}` !== HASH_PREFIX || !rounds || !salt || !hash) return null

  const iterations = Number(rounds)
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) return null

  const saltBytes = fromBase64Url(salt)
  const hashBytes = fromBase64Url(hash)
  if (saltBytes.length === 0 || hashBytes.length === 0) return null

  return { iterations, salt: saltBytes, hash: hashBytes }
}

function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return bytes
}

function constantTimeEquals(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i]! ^ right[i]!
  }
  return diff === 0
}

function toBase64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(normalized + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}