import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'


import './globals.css'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

export const metadata: Metadata = {
  title: 'MAME — Anonymous Reporting Platform',
  description: 'Secure, anonymous university whistleblowing platform backed by real evidence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
