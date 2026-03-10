'use client'

import { useState, useCallback } from 'react'

export interface UseMultiStepFormReturn<T> {
  step: number
  data: T
  isFirst: boolean
  isLast: boolean
  next: () => void
  back: () => void
  update: (fields: Partial<T>) => void
}

export function useMultiStepForm<T>(
  initialData: T,
  totalSteps: number,
): UseMultiStepFormReturn<T> {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<T>(initialData)

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const update = useCallback((fields: Partial<T>) => {
    setData((prev) => ({ ...prev, ...fields }))
  }, [])

  return { step, data, isFirst: step === 0, isLast: step === totalSteps - 1, next, back, update }
}
