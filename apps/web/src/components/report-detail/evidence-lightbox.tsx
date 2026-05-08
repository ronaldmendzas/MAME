'use client'

import { Dialog } from 'radix-ui'
import { useState } from 'react'

interface Props {
  src: string
  alt: string
}

export function EvidenceLightbox({ src, alt }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="cursor-zoom-in">
          <img src={src} alt={alt} loading="lazy" className="h-24 w-24 rounded object-cover" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed inset-4 z-50 flex items-center justify-center">
          <img src={src} alt={alt} loading="eager" className="max-h-full max-w-full rounded-lg" />
          <Dialog.Close className="absolute right-6 top-6 rounded bg-black/50 px-3 py-1 text-white">
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
