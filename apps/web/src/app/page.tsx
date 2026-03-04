import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const Galaxy = dynamic(() => import('@/components/backgrounds/galaxy'), { ssr: false })

export default function HomePage() {
  return (
    <div className="relative -mx-4 -mt-8 flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 -z-10">
        <Galaxy speed={0.3} density={0.7} />
      </div>
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">MAME</h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Anonymous, secure, and verified reporting platform for university communities.
        </p>
        <div className="flex gap-3">
          <Badge variant="secondary">Platform: In Development</Badge>
          <Badge variant="outline">v0.0.1</Badge>
        </div>
        <div className="mt-4 flex gap-4">
          <Button asChild size="lg">
            <Link href="/reports">View Reports</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/reports/create">Submit Report</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
