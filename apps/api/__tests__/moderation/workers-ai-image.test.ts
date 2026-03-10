import { describe, expect, it } from 'vitest'

import { classifyImage } from '../../src/infrastructure/ai/workers-ai-image'

function makeAi(response: unknown) {
  return { run: async () => response }
}

function fakeBuffer(): ArrayBuffer {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer
}

describe('workers-ai-image', () => {
  it('returns safe for "safe" response', async () => {
    const result = await classifyImage(makeAi({ response: 'safe' }), fakeBuffer())
    expect(result.flagged).toBe(false)
    expect(result.score).toBe(0)
    expect(result.categories).toEqual([])
  })

  it('returns flagged for "unsafe" response', async () => {
    const result = await classifyImage(makeAi({ response: 'unsafe' }), fakeBuffer())
    expect(result.flagged).toBe(true)
    expect(result.score).toBe(1)
  })

  it('detects nsfw category in response text', async () => {
    const result = await classifyImage(
      makeAi({ response: 'unsafe - nsfw content detected' }),
      fakeBuffer(),
    )
    expect(result.flagged).toBe(true)
    expect(result.categories).toContain('nsfw')
  })

  it('detects violence category in response text', async () => {
    const result = await classifyImage(
      makeAi({ response: 'This image contains violence' }),
      fakeBuffer(),
    )
    expect(result.flagged).toBe(true)
    expect(result.categories).toContain('violence')
  })

  it('handles missing response gracefully', async () => {
    const result = await classifyImage(makeAi({}), fakeBuffer())
    expect(result.flagged).toBe(true)
    expect(result.score).toBe(1)
  })

  it('handles empty string response as unsafe', async () => {
    const result = await classifyImage(makeAi({ response: '' }), fakeBuffer())
    expect(result.flagged).toBe(true)
  })

  it('passes image bytes to AI binding', async () => {
    let capturedInputs: Record<string, unknown> = {}
    const ai = {
      run: async (_model: string, inputs: Record<string, unknown>) => {
        capturedInputs = inputs
        return { response: 'safe' }
      },
    }
    const buf = new Uint8Array([1, 2, 3]).buffer
    await classifyImage(ai, buf)
    expect(capturedInputs['image']).toEqual([1, 2, 3])
  })

  it('uses the correct vision model', async () => {
    let capturedModel = ''
    const ai = {
      run: async (model: string) => {
        capturedModel = model
        return { response: 'safe' }
      },
    }
    await classifyImage(ai, fakeBuffer())
    expect(capturedModel).toBe('@cf/meta/llama-3.2-11b-vision-instruct')
  })
})
