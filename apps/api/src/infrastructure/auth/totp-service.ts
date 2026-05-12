import type { TotpService, VerifyTotpCodeInput } from '../../domain/ports/totp-service.js'

const TIME_STEP_SECONDS = 30
const TOTP_DIGITS = 6
const DEFAULT_WINDOW = 1
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function createTotpService(): TotpService {
  return {
    generateSecret: () => {
      const bytes = new Uint8Array(20)
      crypto.getRandomValues(bytes)
      return toBase32(bytes)
    },

    buildOtpAuthUri: (input) => {
      const label = `${input.issuer}:${input.accountName}`
      return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(input.secret)}&issuer=${encodeURIComponent(input.issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TIME_STEP_SECONDS}`
    },

    verifyCode: async (input) => verifyTotpCode(input),
  }
}

export async function generateTotpCode(secret: string, at: Date): Promise<string> {
  const key = fromBase32(secret)
  const counter = Math.floor(at.getTime() / 1000 / TIME_STEP_SECONDS)
  const digest = await signCounter(key, counter)
  const offset = digest[digest.length - 1]! & 0x0f
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff)

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

async function verifyTotpCode(input: VerifyTotpCodeInput): Promise<boolean> {
  const code = input.code.trim()
  if (!/^\d{6}$/.test(code)) return false

  const at = input.at ?? new Date()
  const window = Math.max(0, Math.min(input.window ?? DEFAULT_WINDOW, 5))
  for (let drift = -window; drift <= window; drift += 1) {
    const current = new Date(at.getTime() + drift * TIME_STEP_SECONDS * 1000)
    const expected = await generateTotpCode(input.secret, current)
    if (secureStringEquals(expected, code)) return true
  }

  return false
}

async function signCounter(secret: Uint8Array, counter: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, [
    'sign',
  ])
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  const high = Math.floor(counter / 2 ** 32)
  const low = counter >>> 0
  view.setUint32(0, high)
  view.setUint32(4, low)
  const signature = await crypto.subtle.sign('HMAC', key, buffer)
  return new Uint8Array(signature)
}

function toBase32(bytes: Uint8Array): string {
  let value = 0
  let bits = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]!
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]!
  }

  return output
}

function fromBase32(input: string): Uint8Array {
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let value = 0
  let bits = 0
  const bytes: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index < 0) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return new Uint8Array(bytes)
}

function secureStringEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return diff === 0
}
