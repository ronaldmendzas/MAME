import type { ModerationResult } from '../../domain/ports/moderation-port.js'

import type { AiBinding } from './ai-binding.js'

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'
const NSFW_PROMPT = 'Is this image NSFW, violent, or exploitative? Answer only: safe or unsafe'

interface VisionResponse {
  response?: string
}

export async function classifyImage(ai: AiBinding, buffer: ArrayBuffer): Promise<ModerationResult> {
  const image = [...new Uint8Array(buffer)]
  const result = (await ai.run(VISION_MODEL, {
    messages: [{ role: 'user', content: NSFW_PROMPT }],
    image,
  })) as VisionResponse

  return parseVisionResponse(result)
}

function parseVisionResponse(result: VisionResponse): ModerationResult {
  const text = result.response?.trim().toLowerCase() ?? ''
  const isSafe = text.startsWith('safe')

  return {
    flagged: !isSafe,
    categories: isSafe ? [] : extractCategories(text),
    score: isSafe ? 0 : 1,
  }
}

function extractCategories(text: string): string[] {
  const known = ['nsfw', 'violence', 'exploitation', 'csam']
  const found = known.filter((cat) => text.includes(cat))
  return found.length > 0 ? found : [text.split('\n')[0] ?? 'unsafe']
}
