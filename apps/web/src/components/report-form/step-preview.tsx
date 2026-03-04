'use client'

import { getCategoryLabel } from '@/lib/format'
import type { ReportCategory } from '@mame/shared/constants'

interface StepPreviewProps {
  title: string
  body: string
  category: ReportCategory | ''
  faculty: string
}

export function StepPreview({ title, body, category, faculty }: StepPreviewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="text-lg font-semibold">Preview</h3>
      <div>
        <span className="text-xs font-medium text-neutral-500">Title</span>
        <p className="text-sm">{title || '—'}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-neutral-500">Category</span>
        <p className="text-sm">{category ? getCategoryLabel(category) : '—'}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-neutral-500">Faculty</span>
        <p className="text-sm">{faculty || '—'}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-neutral-500">Description</span>
        <p className="whitespace-pre-wrap text-sm">{body || '—'}</p>
      </div>
      <p className="text-xs text-neutral-500">
        Evidence upload will be available in a future update.
      </p>
    </div>
  )
}
