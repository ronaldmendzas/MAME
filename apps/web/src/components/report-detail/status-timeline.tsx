import type { ReportStatus } from '@mame/shared/constants'
import { getStatusColor } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

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
            <Badge className={isActive ? getStatusColor(step.status) : 'bg-muted text-muted-foreground'}>
              {step.label}
            </Badge>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`h-px w-6 ${isActive ? 'bg-foreground/40' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
