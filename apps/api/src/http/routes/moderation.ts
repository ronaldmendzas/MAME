import type { Context } from 'hono'

import { moderateText } from '../../application/moderate-text.js'
import { ValidationError } from '../../domain/errors.js'
import type { AppEnv } from '../../env.js'
import { createWorkersAiModeration } from '../../infrastructure/ai/workers-ai-moderation.js'

import { moderateSchema } from './moderation-schema.js'

export async function handleModerate(c: Context<AppEnv>) {
  const raw = await c.req.json()
  const parsed = moderateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid')
  }

  const moderation = createWorkersAiModeration(c.env.AI)
  const result = await moderateText(parsed.data, { moderation })

  return c.json({ success: true, data: result })
}
