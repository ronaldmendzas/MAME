import { MAX_IMAGE_COMPRESSED_BYTES } from '@mame/shared/constants'

const TARGET = MAX_IMAGE_COMPRESSED_BYTES
const MIN_QUALITY = 0.1
const MAX_QUALITY = 0.92
const STEPS = 5

function isImageType(mime: string) {
  return mime.startsWith('image/')
}

function toWebPBlob(canvas: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('WebP export failed'))),
      'image/webp',
      q,
    )
  })
}

async function findBestQuality(canvas: HTMLCanvasElement) {
  let lo = MIN_QUALITY
  let hi = MAX_QUALITY
  let best = await toWebPBlob(canvas, hi)
  if (best.size <= TARGET) return best
  for (let i = 0; i < STEPS; i++) {
    const mid = (lo + hi) / 2
    const blob = await toWebPBlob(canvas, mid)
    if (blob.size <= TARGET) {
      best = blob
      lo = mid
    } else {
      hi = mid
    }
  }
  return best.size <= TARGET ? best : await toWebPBlob(canvas, lo)
}

export async function compressImage(file: File): Promise<File> {
  if (!isImageType(file.type)) return file
  if (file.size <= TARGET) return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const blob = await findBestQuality(canvas)
  const ext = file.name.replace(/\.[^.]+$/, '.webp')
  return new File([blob], ext, { type: 'image/webp' })
}
