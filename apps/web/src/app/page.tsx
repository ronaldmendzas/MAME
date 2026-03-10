'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const Galaxy = dynamic(() => import('@/components/backgrounds/galaxy'), { ssr: false })

export default function HomePage() {
  return (
    <section className="relative -mt-8 ml-[calc(-50vw+50%)] flex h-[calc(100dvh-4rem)] w-screen items-center justify-center overflow-hidden">
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70" />
      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-6 px-4 text-center sm:gap-8">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-primary sm:text-sm">
            Anonymous Reporting
          </span>
          <h1 className="bg-gradient-to-b from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-5xl font-bold tracking-tighter text-transparent sm:text-7xl md:text-8xl">
            MAME
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
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
        <div className="pointer-events-auto mt-2 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
            <Link href="/reports">View Reports</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-border/50 px-8 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/10">
            <Link href="/reports/create">Submit Report</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
