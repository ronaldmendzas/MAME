export interface ModerationResult {
  flagged: boolean
  categories: string[]
  score: number
}

export interface ModerationPort {
  classifyText(text: string): Promise<ModerationResult>
}
