'use client'

import { useAuth } from '@clerk/nextjs'
import type { ReportCategory } from '@mame/shared/constants'
import { createReportSchema } from '@mame/shared/schemas'
import { useState } from 'react'

import { StepCategory } from './step-category'
import { StepContent } from './step-content'
import { StepPreview } from './step-preview'

import { Button } from '@/components/ui/button'
import { useMultiStepForm } from '@/hooks/use-multi-step-form'
import { createReport } from '@/lib/api'

interface FormData {
  title: string
  body: string
  category: ReportCategory | ''
  faculty: string
}

const INITIAL: FormData = { title: '', body: '', category: '', faculty: '' }
const STEP_LABELS = ['Content', 'Category', 'Preview']

export function ReportForm() {
  const { getToken } = useAuth()
  const { step, data, isFirst, isLast, next, back, update } = useMultiStepForm(INITIAL, 3)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const canAdvanceByStep: Record<number, boolean> = {
    0: data.title.length >= 10 && data.body.length >= 100,
    1: data.category !== '' && data.faculty.length > 0,
  }
  const canAdvance = canAdvanceByStep[step] ?? true

  async function handleSubmit() {
    setError(null)
    const parsed = createReportSchema.safeParse(data)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Invalid'); return }
    const token = await getToken({ template: 'mame-api' })
    if (!token) { setError('Not authenticated'); return }
    setSubmitting(true)
    try {
      await createReport(parsed.data, token)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally { setSubmitting(false) }
  }

  if (success) return <SuccessMessage />

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator current={step} labels={STEP_LABELS} />
      <div className="mt-6">
        {step === 0 && <StepContent title={data.title} body={data.body} onUpdate={update} />}
        {step === 1 && <StepCategory category={data.category} faculty={data.faculty} onUpdate={update} />}
        {step === 2 && <StepPreview {...data} />}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-between">
        <Button onClick={back} disabled={isFirst} variant="outline">Back</Button>
        {isLast
          ? <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
          : <Button onClick={next} disabled={!canAdvance}>Next</Button>}
      </div>
    </div>
  )
}

function StepIndicator({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i <= current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
          <span className={`text-sm ${i <= current ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
          {i < labels.length - 1 && <div className="mx-1 h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  )
}

function SuccessMessage() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
      <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">Report Submitted</h2>
      <p className="mt-2 text-sm text-green-700 dark:text-green-300">Your report has been submitted for review. You can track its status in &quot;My Reports&quot;.</p>
    </div>
  )
}
