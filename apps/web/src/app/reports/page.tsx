import Link from 'next/link'
import { SignedIn } from '@clerk/nextjs'
import { ReportFeed } from '@/components/feed'

export default function ReportsPage() {
  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <SignedIn>
          <Link
            href="/reports/create"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
          >
            New Report
          </Link>
        </SignedIn>
      </div>
      <ReportFeed />
    </div>
  )
}
