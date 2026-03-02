import { describe, expect, it } from 'vitest'

import { validateTransition, canTransition } from '../../src/domain/report-state-machine'
import { ValidationError } from '../../src/domain/errors'

describe('report state machine', () => {
  describe('valid transitions', () => {
    const validCases = [
      ['draft', 'pending'],
      ['pending', 'under_review'],
      ['pending', 'rejected'],
      ['under_review', 'published'],
      ['under_review', 'rejected'],
      ['published', 'archived'],
      ['rejected', 'pending'],
      ['archived', 'published'],
    ] as const

    it.each(validCases)('%s → %s is allowed', (from, to) => {
      expect(() => validateTransition(from, to)).not.toThrow()
      expect(canTransition(from, to)).toBe(true)
    })
  })

  describe('invalid transitions', () => {
    const invalidCases = [
      ['draft', 'published'],
      ['draft', 'archived'],
      ['pending', 'draft'],
      ['published', 'draft'],
      ['resolved', 'pending'],
      ['resolved', 'draft'],
    ] as const

    it.each(invalidCases)('%s → %s is rejected', (from, to) => {
      expect(() => validateTransition(from, to)).toThrow(ValidationError)
      expect(canTransition(from, to)).toBe(false)
    })
  })

  it('resolved has no valid transitions', () => {
    const targets = ['draft', 'pending', 'under_review', 'published', 'rejected', 'archived'] as const
    for (const to of targets) {
      expect(canTransition('resolved', to)).toBe(false)
    }
  })
})
