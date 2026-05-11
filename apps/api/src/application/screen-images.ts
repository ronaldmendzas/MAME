import type { EvidenceRow } from '../domain/ports/evidence-repository.js'
import type { ModerationPort, ModerationResult } from '../domain/ports/moderation-port.js'
import type { StoragePort } from '../domain/ports/storage-port.js'

import { isImageMime } from './moderation-helpers.js'

interface ImageScreenDeps {
  moderation: ModerationPort
  storage: StoragePort
}

export async function screenImages(
  evidence: EvidenceRow[],
  deps: ImageScreenDeps,
): Promise<ModerationResult | null> {
  const images = evidence.filter((e) => isImageMime(e.mimeType))

  for (const img of images) {
    const result = await screenSingleImage(img, deps)
    if (result.flagged) return result
  }
  return null
}

async function screenSingleImage(
  img: EvidenceRow,
  deps: ImageScreenDeps,
): Promise<ModerationResult> {
  const url = deps.storage.getSignedUrl(img.fileKey, 60)
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  return deps.moderation.classifyImage(buffer)
}
