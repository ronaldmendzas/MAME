import { AdminGuard } from '@/components/admin/admin-guard'

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user roles and enforce least-privilege access.
        </p>
      </div>
      <AdminGuard />
    </main>
  )
}