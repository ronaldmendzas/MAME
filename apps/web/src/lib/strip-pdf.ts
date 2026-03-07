import { PDFDocument } from 'pdf-lib'

export async function stripPdfMetadata(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer)

  doc.setTitle('')
  doc.setAuthor('')
  doc.setSubject('')
  doc.setKeywords([])
  doc.setCreator('')
  doc.setProducer('')

  const cleaned = await doc.save()
  const blob = new Blob([cleaned as BlobPart], { type: 'application/pdf' })
  return new File([blob], file.name, { type: 'application/pdf' })
}
