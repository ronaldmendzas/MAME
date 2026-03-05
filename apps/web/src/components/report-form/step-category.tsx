'use client'

import { REPORT_CATEGORIES } from '@mame/shared/constants'
import type { ReportCategory } from '@mame/shared/constants'

import { Input } from '@/components/ui/input'
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
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        <Input
          id="faculty"
          type="text"
          value={faculty}
          onChange={(e) => onUpdate({ faculty: e.target.value })}
          placeholder="e.g. Faculty of Engineering"
        />
      </div>
    </div>
  )
}
