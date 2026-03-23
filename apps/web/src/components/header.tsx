import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

import { SecurityNavLink } from '@/components/security-events/security-nav-link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-1">
          <Link href="/" className="mr-4 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary">
            MAME
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/reports">Reports</Link>
          </Button>
          <SignedIn>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/reports/mine">My Reports</Link>
            </Button>
            <SecurityNavLink />
          </SignedIn>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-primary/40">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild size="sm" className="bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <Link href="/reports/create">New Report</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
