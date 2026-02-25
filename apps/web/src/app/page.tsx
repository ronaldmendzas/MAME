export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <h1 className="text-4xl font-bold tracking-tight">MAME</h1>
      <p className="max-w-lg text-center text-lg text-neutral-600 dark:text-neutral-400">
        Anonymous, secure, and verified reporting platform for university communities.
      </p>
      <div className="flex gap-4">
        <StatusBadge label="Platform" status="In Development" />
        <StatusBadge label="Version" status="v0.0.1" />
      </div>
    </div>
  )
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <span className="text-sm text-neutral-500">{label}: </span>
      <span className="text-sm font-medium">{status}</span>
    </div>
  )
}
