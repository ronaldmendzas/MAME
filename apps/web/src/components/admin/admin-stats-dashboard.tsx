import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminStats } from '@/hooks/use-admin-stats'

function formatCategoryLabel(raw: string): string {
  return raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatusLabel(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{d.label}</span>
          <div className="flex-1">
            <div
              className="h-4 rounded bg-primary/80"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-medium">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string
  value: string | number
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  )
}

export function AdminStatsDashboard({ token }: { token: string }) {
  const { stats, loading, error } = useAdminStats(token)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? 'No stats available'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Reports" value={stats.totalReports} />
        <StatCard title="Total Votes" value={stats.totalVotes} />
        <StatCard title="Total Comments" value={stats.totalComments} />
        <StatCard
          title="Avg Moderation"
          value={
            stats.averageModerationTimeMinutes
              ? `${Math.round(stats.averageModerationTimeMinutes)}m`
              : 'N/A'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.reportsByCategory.map((r) => ({
                label: formatCategoryLabel(r.category),
                value: r.count,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.reportsByStatus.map((r) => ({
                label: formatStatusLabel(r.status),
                value: r.count,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by Faculty</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.reportsByFaculty.map((r) => ({
                label: r.faculty,
                value: r.count,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.reportsByMonth.map((r) => ({
                label: r.month,
                value: r.count,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Active Tokens"
          value={stats.activeTokens}
          description="Anonymous profiles active"
        />
        <StatCard
          title="Suspended Tokens"
          value={stats.suspendedTokens}
          description="Anonymous profiles suspended"
        />
      </div>
    </div>
  )
}
