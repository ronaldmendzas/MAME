import { describe, expect, it } from 'vitest'

import { createWorkersAiModeration } from '../../src/infrastructure/ai/workers-ai-moderation'

function makeAi(response: unknown) {
  return { run: async () => response }
}

describe('workers-ai-moderation', () => {
  it('returns safe when response.safe is true', async () => {
    const mod = createWorkersAiModeration(makeAi({ response: { safe: true, categories: [] } }))
    const result = await mod.classifyText('hello')
    expect(result.flagged).toBe(false)
    expect(result.score).toBe(0)
  })

  it('returns flagged when response.safe is false', async () => {
    const mod = createWorkersAiModeration(
      makeAi({ response: { safe: false, categories: ['violence'] } }),
    )
    const result = await mod.classifyText('bad content')
    expect(result.flagged).toBe(true)
    expect(result.categories).toContain('violence')
  })

  it('parses plain text "safe" response', async () => {
    const mod = createWorkersAiModeration(makeAi({ response: 'safe' }))
    const result = await mod.classifyText('test')
    expect(result.flagged).toBe(false)
  })

  it('parses plain text unsafe response', async () => {
    const mod = createWorkersAiModeration(makeAi({ response: 'unsafe\nS1' }))
    const result = await mod.classifyText('test')
    expect(result.flagged).toBe(true)
  })

  it('handles missing response gracefully', async () => {
    const mod = createWorkersAiModeration(makeAi({}))
    const result = await mod.classifyText('test')
    expect(result.flagged).toBe(false)
    expect(result.score).toBe(0)
  })
})
