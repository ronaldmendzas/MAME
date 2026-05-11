'use client'

import { ChevronDown, EyeOff, Lock, Shield, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Shield, label: 'Identidad 100% anónima' },
  { icon: Lock, label: 'Datos cifrados y protegidos' },
  { icon: EyeOff, label: 'Nadie puede rastrear tu actividad' },
] as const

function FeatureItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
        <Icon className="size-3 text-primary" />
      </div>
      <span className="text-xs text-muted-foreground/80">{label}</span>
    </div>
  )
}

function DetailsPanel({ open }: { open: boolean }) {
  const gridClass = open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'

  return (
    <div
      id="privacy-details"
      className={cn('grid transition-all duration-300 ease-in-out', gridClass)}
    >
      <div className="overflow-hidden">
        <div className="space-y-2.5 rounded-b-xl border border-t-0 border-border/40 bg-card/50 px-4 pb-4 pt-2 backdrop-blur-sm">
          {FEATURES.map((f) => (
            <FeatureItem key={f.label} icon={f.icon} label={f.label} />
          ))}
          <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground/50">
            MAME utiliza cifrado avanzado y anonimización total. Ni siquiera nosotros podemos
            vincular tu cuenta con tu identidad real.
          </p>
        </div>
      </div>
    </div>
  )
}

export function PrivacyNotice() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="privacy-details"
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border border-border/40 px-4 py-3',
          'bg-card/50 text-left backdrop-blur-sm transition-all duration-300',
          'hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5',
          open && 'rounded-b-none border-b-transparent',
        )}
      >
        <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          Tu identidad está completamente protegida
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground/60 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <DetailsPanel open={open} />
    </div>
  )
}
