'use client'

import { useAuth } from '@clerk/nextjs'
import type { Report } from '@mame/shared/types'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ReportDetail } from '@/components/report-detail'
import { fetchReport } from '@/lib/api'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken({ template: 'mame-api' })
        const res = await fetchReport(id, token ?? undefined)
        setReport(res.data ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load report')
      }
    }

    void load()
  }, [id, getToken])

  if (error) return <p className="py-20 text-center text-red-500">{error}</p>
  if (!report) return <LoadingSkeleton />
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <ReportDetail report={report} />
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8">
      <div className="flex gap-2">
        <div className="h-6 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="h-8 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}
