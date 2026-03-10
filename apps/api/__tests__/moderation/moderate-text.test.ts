import { describe, expect, it } from 'vitest'

import { moderateText } from '../../src/application/moderate-text'

function makeMod(flagged: boolean, categories: string[] = []) {
  return {
    classifyText: async () => ({
      flagged,
      categories,
      score: flagged ? 1 : 0,
    }),
  }
}

describe('moderate-text', () => {
  it('combines title and body for classification', async () => {
    let captured = ''
    const moderation = {
      classifyText: async (text: string) => {
        captured = text
        return { flagged: false, categories: [], score: 0 }
      },
    }
    await moderateText(
      { title: 'Title', body: 'Body text' },
      { moderation },
    )
    expect(captured).toBe('Title\n\nBody text')
  })

  it('returns safe result when content is clean', async () => {
    const result = await moderateText(
      { title: 'Test', body: 'Clean content' },
      { moderation: makeMod(false) },
    )
    expect(result.flagged).toBe(false)
  })

  it('returns flagged result for harmful content', async () => {
    const result = await moderateText(
      { title: 'Bad', body: 'Harmful' },
      { moderation: makeMod(true, ['violence']) },
    )
    expect(result.flagged).toBe(true)
    expect(result.categories).toContain('violence')
  })
})
