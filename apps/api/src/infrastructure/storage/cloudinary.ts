import type { StoragePort, UploadResult } from '../../domain/ports/storage-port.js'

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

async function signPayload(params: Record<string, string>, secret: string): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(sorted))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function createCloudinaryStorage(config: CloudinaryConfig): StoragePort {
  const { cloudName, apiKey, apiSecret } = config
  const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`

  return {
    async upload(file: ArrayBuffer, filename: string, mimeType: string): Promise<UploadResult> {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const params = { public_id: filename, timestamp }
      const signature = await signPayload(params, apiSecret)

      const form = new FormData()
      form.append('file', new Blob([file], { type: mimeType }), filename)
      form.append('public_id', filename)
      form.append('timestamp', timestamp)
      form.append('api_key', apiKey)
      form.append('signature', signature)

      const res = await fetch(`${baseUrl}/auto/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`)

      const data = (await res.json()) as { public_id: string; secure_url: string; bytes: number }
      return { fileKey: data.public_id, url: data.secure_url, bytes: data.bytes }
    },

    getSignedUrl(fileKey: string): string {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${fileKey}`
    },

    async delete(fileKey: string): Promise<void> {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const params = { public_id: fileKey, timestamp }
      const signature = await signPayload(params, apiSecret)

      const form = new FormData()
      form.append('public_id', fileKey)
      form.append('timestamp', timestamp)
      form.append('api_key', apiKey)
      form.append('signature', signature)

      await fetch(`${baseUrl}/image/destroy`, { method: 'POST', body: form })
    },
  }
}
