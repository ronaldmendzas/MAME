import { describe, expect, it } from 'vitest'

import { createReportSchema } from '../src/schemas/index.js'

describe('createReportSchema', () => {
  it('accepts valid report input', () => {
    const input = {
      title: 'Corruption in Faculty',
      body: 'A'.repeat(100),
      category: 'academic-corruption' as const,
      faculty: 'Engineering',
    }

    const result = createReportSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects title shorter than 10 characters', () => {
    const input = {
      title: 'Short',
      body: 'A'.repeat(100),
      category: 'fraud' as const,
      faculty: 'Law',
    }

    const result = createReportSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects body shorter than 100 characters', () => {
    const input = {
      title: 'Valid Title Here',
      body: 'Too short',
      category: 'discrimination' as const,
      faculty: 'Medicine',
    }

    const result = createReportSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const input = {
      title: 'Valid Title Here',
      body: 'A'.repeat(100),
      category: 'invalid-category',
      faculty: 'Science',
    }

    const result = createReportSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
