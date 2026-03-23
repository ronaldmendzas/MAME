import { ModerationGuard } from '@/components/moderation/moderation-guard'

export default function ModerationPage() {
  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve pending reports before they become public.
        </p>
      </div>
      <ModerationGuard />
    </main>
  )
}
