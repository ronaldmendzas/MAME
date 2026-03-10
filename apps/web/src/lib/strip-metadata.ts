import { stripImageViaCanvas } from './strip-image'
import { stripJpegExif } from './strip-jpeg'
import { stripPdfMetadata } from './strip-pdf'

export async function stripMetadata(file: File): Promise<File> {
  switch (file.type) {
    case 'image/jpeg':
      return stripJpegExif(file)
    case 'image/png':
    case 'image/webp':
      return stripImageViaCanvas(file)
    case 'application/pdf':
      return stripPdfMetadata(file)
    default:
      return file
  }
}
