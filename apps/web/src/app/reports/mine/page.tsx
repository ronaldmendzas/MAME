import { MyReportsList } from '@/components/my-reports'

export default function MyReportsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Reports</h1>
      <MyReportsList />
    </main>
  )
}
