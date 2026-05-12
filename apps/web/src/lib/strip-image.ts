export function stripImageViaCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unsupported'))
        return
      }
      ctx.drawImage(img, 0, 0)

      const mime = file.type === 'image/webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas export failed'))
            return
          }
          resolve(new File([blob], file.name, { type: mime }))
        },
        mime,
        0.92,
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
