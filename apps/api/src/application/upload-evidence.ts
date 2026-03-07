import { ValidationError } from '../domain/errors.js'
import { detectMimeType, isAllowedType } from '../domain/magic-bytes.js'
import type { EvidenceRepository, EvidenceRow } from '../domain/ports/evidence-repository.js'
import type { StoragePort } from '../domain/ports/storage-port.js'

interface UploadInput {
  reportId: string
  file: ArrayBuffer
  filename: string
}

interface Deps {
  storage: StoragePort
  evidenceRepo: EvidenceRepository
}

export async function uploadEvidence(input: UploadInput, deps: Deps): Promise<EvidenceRow> {
  if (input.file.byteLength === 0) {
    throw new ValidationError('File is empty')
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024
  if (input.file.byteLength > MAX_FILE_SIZE) {
    throw new ValidationError('File exceeds 5 MB limit')
  }

  const detectedMime = detectMimeType(input.file)
  if (!detectedMime || !isAllowedType(detectedMime)) {
    throw new ValidationError('Unsupported file type')
  }

  const fileKey = `evidence/${crypto.randomUUID()}`
  const result = await deps.storage.upload(input.file, fileKey, detectedMime)

  return deps.evidenceRepo.insert({
    reportId: input.reportId,
    type: 'file',
    fileKey: result.fileKey,
    mimeType: detectedMime,
    sizeBytes: result.bytes,
  })
}
