'use client'

import type { ReportCategory } from '@mame/shared/constants'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategoryLabel } from '@/lib/format'

interface StepPreviewProps {
  title: string
  body: string
  category: ReportCategory | ''
  faculty: string
}

export function StepPreview({ title, body, category, faculty }: StepPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label="Title" value={title} />
        <Field label="Category" value={category ? getCategoryLabel(category) : '—'} />
        <Field label="Faculty" value={faculty} />
        <div>
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <p className="whitespace-pre-wrap text-sm">{body || '—'}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          You can attach evidence after submitting the report.
        </p>
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}
