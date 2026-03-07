'use client'

import { useAuth } from '@clerk/nextjs'
import { MAX_FILE_SIZE_BYTES } from '@mame/shared/constants'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { uploadEvidence, type EvidenceItem } from '@/lib/api'

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.mp4,.mp3'

interface Props {
  reportId: string
  onUploaded: (item: EvidenceItem) => void
}

export function EvidenceUpload({ reportId, onUploaded }: Props) {
  const { getToken } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File exceeds 5 MB limit')
      return
    }
    const token = await getToken()
    if (!token) { setError('Not authenticated'); return }
    setUploading(true)
    try {
      const res = await uploadEvidence(reportId, file, token)
      if (res.data) onUploaded(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally { setUploading(false) }
  }, [reportId, getToken, onUploaded])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onInputChange} className="hidden" />
      <p className="mb-2 text-sm text-muted-foreground">Drag & drop a file or</p>
      <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? 'Uploading...' : 'Choose File'}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, WebP, PDF, MP4, MP3 — max 5 MB</p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
