import dynamic from 'next/dynamic'

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="mx-1 h-px w-8 bg-border" />
        <div className="h-7 w-7 rounded-full bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-10 w-full rounded-md bg-muted" />
        <div className="h-32 w-full rounded-md bg-muted" />
      </div>
      <div className="flex justify-between">
        <div className="h-9 w-16 rounded-md bg-muted" />
        <div className="h-9 w-16 rounded-md bg-muted" />
      </div>
    </div>
  )
}

const ReportForm = dynamic(() => import('@/components/report-form').then((m) => m.ReportForm), {
  loading: FormSkeleton,
})

export default function CreateReportPage() {
  return (
    <div className="py-8">
      <h1 className="mb-8 text-2xl font-bold">Create Report</h1>
      <ReportForm />
    </div>
  )
}
