import { describe, expect, it } from 'vitest'

import { createCommentSchema, createReportSchema, paginationSchema } from '../src/schemas/index.js'

describe('createReportSchema', () => {
  const validInput = {
    title: 'Corruption in Faculty',
    body: 'A'.repeat(100),
    category: 'academic-corruption' as const,
    faculty: 'Engineering',
  }

  it('accepts valid report input', () => {
    const result = createReportSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts all valid categories', () => {
    const categories = [
      'sexual-harassment',
      'academic-corruption',
      'faculty-plagiarism',
      'discrimination',
      'nepotism',
      'administrative-irregularities',
      'fraud',
      'other',
    ] as const

    for (const category of categories) {
      const result = createReportSchema.safeParse({ ...validInput, category })
      expect(result.success).toBe(true)
    }
  })

  it('rejects title shorter than 10 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, title: 'Short' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, title: 'X'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts title at exactly 10 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, title: 'A'.repeat(10) })
    expect(result.success).toBe(true)
  })

  it('accepts title at exactly 200 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, title: 'A'.repeat(200) })
    expect(result.success).toBe(true)
  })

  it('rejects body shorter than 100 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, body: 'Too short' })
    expect(result.success).toBe(false)
  })

  it('rejects body longer than 5000 characters', () => {
    const result = createReportSchema.safeParse({ ...validInput, body: 'X'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = createReportSchema.safeParse({ ...validInput, category: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty faculty', () => {
    const result = createReportSchema.safeParse({ ...validInput, faculty: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createReportSchema.safeParse({}).success).toBe(false)
    expect(createReportSchema.safeParse({ title: 'Valid Title' }).success).toBe(false)
  })
})

describe('createCommentSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000'

  const validComment = {
    reportId: validUuid,
    body: 'This is a valid comment',
  }

  it('accepts valid comment input', () => {
    const result = createCommentSchema.safeParse(validComment)
    expect(result.success).toBe(true)
  })

  it('accepts comment with optional parentId', () => {
    const result = createCommentSchema.safeParse({
      ...validComment,
      parentId: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty body', () => {
    const result = createCommentSchema.safeParse({ ...validComment, body: '' })
    expect(result.success).toBe(false)
  })

  it('rejects body longer than 1000 characters', () => {
    const result = createCommentSchema.safeParse({ ...validComment, body: 'X'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid reportId (not UUID)', () => {
    const result = createCommentSchema.safeParse({ ...validComment, reportId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid parentId (not UUID)', () => {
    const result = createCommentSchema.safeParse({
      ...validComment,
      parentId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('accepts valid pagination with defaults', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.cursor).toBeUndefined()
    }
  })

  it('accepts custom limit', () => {
    const result = paginationSchema.safeParse({ limit: 10 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(10)
    }
  })

  it('accepts string limit (coercion)', () => {
    const result = paginationSchema.safeParse({ limit: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(25)
    }
  })

  it('rejects limit below 1', () => {
    const result = paginationSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit above 50', () => {
    const result = paginationSchema.safeParse({ limit: 51 })
    expect(result.success).toBe(false)
  })

  it('accepts cursor string', () => {
    const result = paginationSchema.safeParse({ cursor: 'abc123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cursor).toBe('abc123')
    }
  })
})
