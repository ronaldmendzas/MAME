'use client'

import { useAuth } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'

import { EvidenceGallery } from './evidence-gallery'
import { LinkForm } from './link-form'
import { SubmitButton } from './submit-button'

const EvidenceUpload = dynamic(() => import('./evidence-upload').then((m) => m.EvidenceUpload), {
  ssr: false,
})

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchEvidence, type EvidenceItem } from '@/lib/api'

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
        <EvidenceGallery items={items} />
        {isSignedIn && <EvidenceUpload reportId={reportId} onUploaded={onUploaded} />}
        {isSignedIn && <LinkForm reportId={reportId} onAdded={onUploaded} />}
        {isSignedIn && <SubmitButton reportId={reportId} hasEvidence={items.length > 0} />}
      </CardContent>
    </Card>
  )
}
