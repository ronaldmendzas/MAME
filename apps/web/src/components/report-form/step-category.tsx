'use client'

import { REPORT_CATEGORIES } from '@mame/shared/constants'
import type { ReportCategory } from '@mame/shared/constants'
import { getCategoryLabel } from '@/lib/format'

interface StepCategoryProps {
  category: ReportCategory | ''
  faculty: string
  onUpdate: (fields: { category?: ReportCategory; faculty?: string }) => void
}

export function StepCategory({ category, faculty, onUpdate }: StepCategoryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => onUpdate({ category: e.target.value as ReportCategory })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Select a category...</option>
          {REPORT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="faculty" className="mb-1 block text-sm font-medium">
          Faculty / Department
        </label>
        <input
          id="faculty"
          type="text"
          value={faculty}
          onChange={(e) => onUpdate({ faculty: e.target.value })}
          placeholder="e.g. Faculty of Engineering"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
    </div>
  )
}
