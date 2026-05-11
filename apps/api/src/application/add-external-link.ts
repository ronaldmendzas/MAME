import { z } from 'zod'

import { ValidationError } from '../domain/errors.js'
import type { EvidenceRepository, EvidenceRow } from '../domain/ports/evidence-repository.js'

const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'drive.google.com',
  'docs.google.com',
  'dropbox.com',
  'www.dropbox.com',
]

const linkSchema = z.string().url().max(2048)

export interface AddLinkInput {
  reportId: string
  url: string
}

export interface AddLinkDeps {
  evidenceRepo: EvidenceRepository
}

export async function addExternalLink(
  input: AddLinkInput,
  deps: AddLinkDeps,
): Promise<EvidenceRow> {
  const parsed = linkSchema.safeParse(input.url)
  if (!parsed.success) throw new ValidationError('Invalid URL')

  const hostname = new URL(parsed.data).hostname
  if (!ALLOWED_HOSTS.includes(hostname)) {
    throw new ValidationError('URL host not allowed')
  }

  return deps.evidenceRepo.insert({
    reportId: input.reportId,
    type: 'external_link',
    fileKey: parsed.data,
    mimeType: 'text/uri-list',
    sizeBytes: 0,
  })
}
