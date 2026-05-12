import { ValidationError } from '../../domain/errors.js'
import type { SecretCipher } from '../../domain/ports/secret-cipher.js'

const CIPHER_PREFIX = 'a256gcm'
const IV_BYTES = 12

export function createSecretCipher(hexKey: string): SecretCipher {
  return {
    encrypt: async (plainText) => {
      const key = await importAesKey(hexKey)
      const iv = new Uint8Array(IV_BYTES)
      crypto.getRandomValues(iv)

      const encoded = new TextEncoder().encode(plainText)
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

      return `${CIPHER_PREFIX}$${toBase64Url(iv)}$${toBase64Url(new Uint8Array(encrypted))}`
    },

    decrypt: async (cipherText) => {
      const [prefix, ivRaw, payloadRaw] = cipherText.split('$')
      if (prefix !== CIPHER_PREFIX || !ivRaw || !payloadRaw) {
        throw new ValidationError('Invalid secret cipher payload')
      }

      const key = await importAesKey(hexKey)
      const iv = fromBase64Url(ivRaw)
      const payload = fromBase64Url(payloadRaw)

      try {
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload)
        return new TextDecoder().decode(decrypted)
      } catch {
        throw new ValidationError('Failed to decrypt MFA secret')
      }
    },
  }
}

async function importAesKey(hexKey: string): Promise<CryptoKey> {
  const normalized = hexKey.trim()
  if (!/^[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new ValidationError('Secret cipher key must be 64 hex chars')
  }

  return crypto.subtle.importKey('raw', hexToBytes(normalized), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function toBase64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
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
