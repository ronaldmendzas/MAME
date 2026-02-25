import { describe, expect, it } from 'vitest'

import {
  EVIDENCE_TYPES,
  FLAG_CATEGORIES,
  FLAG_THRESHOLD,
  MAX_BODY_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_FILE_SIZE_BYTES,
  MAX_REPORTS_PER_DAY,
  MAX_TITLE_LENGTH,
  MIN_BODY_LENGTH,
  MIN_TITLE_LENGTH,
  MODERATION_ACTIONS,
  PUBLICATION_DELAY_MAX_SECONDS,
  PUBLICATION_DELAY_MIN_SECONDS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  USER_ROLES,
} from '../src/constants/index.js'

describe('REPORT_CATEGORIES', () => {
  it('contains 8 categories', () => {
    expect(REPORT_CATEGORIES).toHaveLength(8)
  })

  it('includes key categories', () => {
    expect(REPORT_CATEGORIES).toContain('sexual-harassment')
    expect(REPORT_CATEGORIES).toContain('academic-corruption')
    expect(REPORT_CATEGORIES).toContain('fraud')
    expect(REPORT_CATEGORIES).toContain('other')
  })
})

describe('REPORT_STATUSES', () => {
  it('contains 7 statuses', () => {
    expect(REPORT_STATUSES).toHaveLength(7)
  })

  it('includes lifecycle statuses', () => {
    expect(REPORT_STATUSES).toContain('draft')
    expect(REPORT_STATUSES).toContain('pending')
    expect(REPORT_STATUSES).toContain('published')
    expect(REPORT_STATUSES).toContain('resolved')
  })
})

describe('USER_ROLES', () => {
  it('contains exactly 3 roles', () => {
    expect(USER_ROLES).toEqual(['user', 'moderator', 'admin'])
  })
})

describe('EVIDENCE_TYPES', () => {
  it('contains exactly 2 types', () => {
    expect(EVIDENCE_TYPES).toEqual(['file', 'external_link'])
  })
})

describe('MODERATION_ACTIONS', () => {
  it('contains 4 actions', () => {
    expect(MODERATION_ACTIONS).toHaveLength(4)
    expect(MODERATION_ACTIONS).toContain('approve')
    expect(MODERATION_ACTIONS).toContain('reject')
  })
})

describe('FLAG_CATEGORIES', () => {
  it('contains 5 flag types', () => {
    expect(FLAG_CATEGORIES).toHaveLength(5)
    expect(FLAG_CATEGORIES).toContain('false_report')
    expect(FLAG_CATEGORIES).toContain('exposed_data')
  })
})

describe('numeric constants', () => {
  it('title length limits are valid', () => {
    expect(MIN_TITLE_LENGTH).toBe(10)
    expect(MAX_TITLE_LENGTH).toBe(200)
    expect(MIN_TITLE_LENGTH).toBeLessThan(MAX_TITLE_LENGTH)
  })

  it('body length limits are valid', () => {
    expect(MIN_BODY_LENGTH).toBe(100)
    expect(MAX_BODY_LENGTH).toBe(5000)
    expect(MIN_BODY_LENGTH).toBeLessThan(MAX_BODY_LENGTH)
  })

  it('max comment length is 1000', () => {
    expect(MAX_COMMENT_LENGTH).toBe(1000)
  })

  it('max file size is 5MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024)
  })

  it('rate limit is 10 reports per day', () => {
    expect(MAX_REPORTS_PER_DAY).toBe(10)
  })

  it('flag threshold is 5', () => {
    expect(FLAG_THRESHOLD).toBe(5)
  })

  it('publication delay range is 1h to 6h', () => {
    expect(PUBLICATION_DELAY_MIN_SECONDS).toBe(3600)
    expect(PUBLICATION_DELAY_MAX_SECONDS).toBe(21600)
    expect(PUBLICATION_DELAY_MIN_SECONDS).toBeLessThan(PUBLICATION_DELAY_MAX_SECONDS)
  })
})
