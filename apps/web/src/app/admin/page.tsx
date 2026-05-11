import { auth } from '@clerk/nextjs/server'

import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminStatsDashboard } from '@/components/admin/admin-stats-dashboard'

export default async function AdminPage() {
  const session = await auth()
  const token = await session.getToken()

  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user roles and view platform statistics.
        </p>
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Statistics</h2>
          <AdminStatsDashboard token={token ?? ''} />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">User Management</h2>
          <AdminGuard />
        </section>
      </div>
    </main>
  )
}
