'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { submitForReview, type SubmitResult } from '@/lib/api'

interface Props {
  reportId: string
  hasEvidence: boolean
}

export function SubmitButton({ reportId, hasEvidence }: Props) {
  const { getToken } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    setError(null)
    const token = await getToken({ template: 'mame-api' })
    if (!token) { setError('Not authenticated'); return }

    setSubmitting(true)
    try {
      const res = await submitForReview(reportId, token)
      if (res.data) setResult(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally { setSubmitting(false) }
  }, [reportId, getToken])

  if (result?.outcome === 'submitted') {
    return <p className="text-sm font-medium text-green-600">Submitted for review</p>
  }

  if (result?.outcome === 'rejected') {
    return <p className="text-sm text-destructive">Rejected: {result.reason}</p>
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleSubmit}
        disabled={!hasEvidence || submitting}
      >
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </Button>
      {!hasEvidence && (
        <p className="text-xs text-muted-foreground">Add at least one evidence to submit</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
