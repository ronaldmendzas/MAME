'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addExternalLink, type EvidenceItem } from '@/lib/api'

interface Props {
  reportId: string
  onAdded: (item: EvidenceItem) => void
}

export function LinkForm({ reportId, onAdded }: Props) {
  const { getToken } = useAuth()
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!url.trim()) return

    const token = await getToken({ template: 'mame-api' })
    if (!token) { setError('Not authenticated'); return }

    setSubmitting(true)
    try {
      const res = await addExternalLink(reportId, url.trim(), token)
      if (res.data) onAdded(res.data)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link')
    } finally { setSubmitting(false) }
  }, [url, reportId, getToken, onAdded])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="url"
        placeholder="YouTube, Drive, or Dropbox URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="outline" size="sm" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Link'}
      </Button>
      {error && <p className="self-center text-xs text-destructive">{error}</p>}
    </form>
  )
}
