import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'MAME — Anonymous Reporting Platform',
  description: 'Secure, anonymous university whistleblowing platform backed by real evidence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <span className="text-xl font-bold tracking-tight">MAME</span>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
      <p>MAME — Anonymous Reporting Platform</p>
    </footer>
  )
}
