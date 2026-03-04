import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight">
            MAME
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reports">Reports</Link>
          </Button>
          <SignedIn>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports/mine">My Reports</Link>
            </Button>
          </SignedIn>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="outline" size="sm">
              <Link href="/reports/create">New Report</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
