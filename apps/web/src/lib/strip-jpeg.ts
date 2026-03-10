import piexif from 'piexifjs'

export async function stripJpegExif(file: File): Promise<File> {
  const data = await readAsDataURL(file)
  const stripped = piexif.remove(data)
  const blob = dataURLToBlob(stripped)
  return new File([blob], file.name, { type: 'image/jpeg' })
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataURLToBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(',')
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
