'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

import { EvidenceUpload } from './evidence-upload'
import { LinkForm } from './link-form'
import { SubmitButton } from './submit-button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchEvidence, type EvidenceItem } from '@/lib/api'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EvidenceSection({ reportId }: { reportId: string }) {
  const { isSignedIn } = useAuth()
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvidence(reportId)
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [reportId])

  const onUploaded = useCallback((item: EvidenceItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-base">Evidence</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No evidence attached yet.</p>
        )}
        {items.map((item) => (
          <EvidenceRow key={item.id} item={item} />
        ))}
        {isSignedIn && <EvidenceUpload reportId={reportId} onUploaded={onUploaded} />}
        {isSignedIn && <LinkForm reportId={reportId} onAdded={onUploaded} />}
        {isSignedIn && <SubmitButton reportId={reportId} hasEvidence={items.length > 0} />}
      </CardContent>
    </Card>
  )
}

function getIcon(item: EvidenceItem): string {
  if (item.type === 'external_link') return '🔗'
  if (item.mimeType.startsWith('image/')) return '🖼️'
  return '📎'
}

function getLabel(item: EvidenceItem): string {
  if (item.type === 'external_link') return item.fileKey
  return item.fileKey.split('/').pop() ?? item.fileKey
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const href = item.type === 'external_link' ? item.fileKey : item.url

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
    >
      <span className="text-lg">{getIcon(item)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{getLabel(item)}</p>
        <p className="text-xs text-muted-foreground">
          {item.type === 'external_link' ? 'External link' : `${item.mimeType} — ${formatSize(item.sizeBytes)}`}
        </p>
      </div>
    </a>
  )
}
