import type { ReportStatus } from '@mame/shared/constants'
import { getStatusColor } from '@/lib/format'

interface StatusTimelineProps {
  currentStatus: ReportStatus
}

const TIMELINE_STEPS: { status: ReportStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'published', label: 'Published' },
]

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.status === currentStatus)

  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STEPS.map((step, i) => {
        const isActive = i <= currentIndex
        return (
          <div key={step.status} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? getStatusColor(step.status) : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'}`}>
              {step.label}
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`h-px w-6 ${isActive ? 'bg-neutral-400' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
