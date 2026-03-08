import type { ModerationPort, ModerationResult } from '../domain/ports/moderation-port.js'

export interface ModerateTextInput {
  title: string
  body: string
}

export interface ModerateTextDeps {
  moderation: ModerationPort
}

export async function moderateText(
  input: ModerateTextInput,
  deps: ModerateTextDeps,
): Promise<ModerationResult> {
  const combined = `${input.title}\n\n${input.body}`
  return deps.moderation.classifyText(combined)
}
