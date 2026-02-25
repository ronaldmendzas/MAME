import { describe, expect, it } from 'vitest'

import {
  EVIDENCE_TYPES,
  MAX_BODY_LENGTH,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  USER_ROLES,
  createCommentSchema,
  createReportSchema,
  paginationSchema,
} from '../src/index.js'

describe('barrel exports from @mame/shared', () => {
  it('exports all constants', () => {
    expect(REPORT_CATEGORIES).toBeDefined()
    expect(REPORT_STATUSES).toBeDefined()
    expect(USER_ROLES).toBeDefined()
    expect(EVIDENCE_TYPES).toBeDefined()
    expect(MAX_BODY_LENGTH).toBeDefined()
  })

  it('exports all schemas', () => {
    expect(createReportSchema).toBeDefined()
    expect(createCommentSchema).toBeDefined()
    expect(paginationSchema).toBeDefined()
  })

  it('schemas are functional through barrel export', () => {
    const result = createReportSchema.safeParse({
      title: 'Test Title Here',
      body: 'B'.repeat(100),
      category: 'fraud',
      faculty: 'CS',
    })
    expect(result.success).toBe(true)
  })
})
