import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="py-8 text-center text-sm text-muted-foreground">
        <p>MAME — Anonymous Reporting Platform</p>
      </div>
    </footer>
  )
}
