'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const Galaxy = dynamic(() => import('@/components/backgrounds/galaxy'), { ssr: false })

export default function HomePage() {
  return (
    <div className="relative -mx-6 -mt-8 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0">
        <Galaxy
          speed={0.3}
          density={0.7}
          mouseInteraction
          mouseRepulsion
          repulsionStrength={3}
          glowIntensity={0.5}
          twinkleIntensity={0.5}
          rotationSpeed={0.05}
          transparent={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/80" />
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Anonymous Reporting
          </span>
          <h1 className="bg-gradient-to-b from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-6xl font-bold tracking-tighter text-transparent sm:text-8xl">
            MAME
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
            Secure, anonymous, and verified reporting platform for university communities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="border border-border/50 bg-secondary/50 backdrop-blur-sm">
            In Development
          </Badge>
          <Badge variant="outline" className="border-border/50 backdrop-blur-sm">
            v0.0.1
          </Badge>
        </div>
        <div className="mt-2 flex gap-4">
          <Button asChild size="lg" className="bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
            <Link href="/reports">View Reports</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-border/50 px-8 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/10">
            <Link href="/reports/create">Submit Report</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
