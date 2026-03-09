import type {
  ModerationPort,
  ModerationResult,
} from '../../domain/ports/moderation-port.js'
import type { AiBinding } from './ai-binding.js'
import { classifyImage } from './workers-ai-image.js'

interface GuardResponse {
  response?: { safe?: boolean; categories?: string[] } | string
}

export function createWorkersAiModeration(ai: AiBinding): ModerationPort {
  return {
    classifyText: (text) => classifyText(ai, text),
    classifyImage: (buffer) => classifyImage(ai, buffer),
  }
}

async function classifyText(
  ai: AiBinding,
  text: string,
): Promise<ModerationResult> {
  const result = (await ai.run('@cf/meta/llama-guard-3-8b', {
    messages: [{ role: 'user', content: text }],
  })) as GuardResponse

  return parseGuardResponse(result)
}

function parseGuardResponse(result: GuardResponse): ModerationResult {
  const res = result.response
  if (typeof res === 'string') return parsePlainResponse(res)
  if (!res) return { flagged: false, categories: [], score: 0 }

  return {
    flagged: !res.safe,
    categories: res.categories ?? [],
    score: res.safe ? 0 : 1,
  }
}

function parsePlainResponse(text: string): ModerationResult {
  const isSafe = text.trim().toLowerCase().startsWith('safe')
  return {
    flagged: !isSafe,
    categories: isSafe ? [] : [text.trim()],
    score: isSafe ? 0 : 1,
  }
}
