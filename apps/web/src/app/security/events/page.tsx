import { SecurityEventsGuard } from '@/components/security-events/security-events-guard'

export default function SecurityEventsPage() {
  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Security Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auditor and admin read-only view for authentication and access-control events.
        </p>
      </div>
      <SecurityEventsGuard />
    </main>
  )
}
