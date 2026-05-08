import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

const AdminNavLink = dynamic(
  () => import('@/components/admin/admin-nav-link').then((m) => m.AdminNavLink),
  { ssr: false },
)
const ModerationNavLink = dynamic(
  () => import('@/components/moderation/moderation-nav-link').then((m) => m.ModerationNavLink),
  { ssr: false },
)
const SecurityNavLink = dynamic(
  () => import('@/components/security-events/security-nav-link').then((m) => m.SecurityNavLink),
  { ssr: false },
)

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="mr-4 flex min-h-[44px] items-center text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            MAME
          </Link>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-muted-foreground hover:text-foreground"
          >
            <Link href="/reports">Reports</Link>
          </Button>
          <SignedIn>
            <span className="hidden sm:contents">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="min-h-[44px] text-muted-foreground hover:text-foreground"
              >
                <Link href="/reports/mine">My Reports</Link>
              </Button>
            </span>
            <AdminNavLink />
            <ModerationNavLink />
            <SecurityNavLink />
          </SignedIn>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-muted-foreground hover:text-foreground"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="min-h-[44px] bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-primary/40"
            >
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              asChild
              size="sm"
              className="min-h-[44px] bg-primary text-primary-foreground shadow-sm shadow-primary/25"
            >
              <Link href="/reports/create">New Report</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
