import { describe, it, expect } from 'vitest'

import {
  isImageMime,
  buildTextPayload,
  hasRejection,
  firstFlagged,
} from '../../src/application/moderation-helpers.js'

describe('moderation-helpers', () => {
  it('isImageMime detects image types', () => {
    expect(isImageMime('image/png')).toBe(true)
    expect(isImageMime('image/jpeg')).toBe(true)
    expect(isImageMime('application/pdf')).toBe(false)
  })

  it('buildTextPayload joins title and body', () => {
    expect(buildTextPayload('Title', 'Body')).toBe('Title\n\nBody')
  })

  it('hasRejection returns true if any flagged', () => {
    const safe = { flagged: false, categories: [], score: 0 }
    const flagged = { flagged: true, categories: ['nsfw'], score: 0.9 }
    expect(hasRejection([safe, flagged])).toBe(true)
    expect(hasRejection([safe])).toBe(false)
  })

  it('firstFlagged returns first flagged result', () => {
    const safe = { flagged: false, categories: [], score: 0 }
    const flagged = { flagged: true, categories: ['nsfw'], score: 0.9 }
    expect(firstFlagged([safe, flagged])).toEqual(flagged)
    expect(firstFlagged([safe])).toBeUndefined()
  })
})
