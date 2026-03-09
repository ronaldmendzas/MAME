import { SignedIn } from '@clerk/nextjs'
import Link from 'next/link'

import { ReportFeed } from '@/components/feed'

export default function ReportsPage() {
  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse community reports</p>
        </div>
        <SignedIn>
          <Link
            href="/reports/create"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:shadow-md hover:shadow-primary/30"
          >
            New Report
          </Link>
        </SignedIn>
      </div>
      <ReportFeed />
    </div>
  )
}
