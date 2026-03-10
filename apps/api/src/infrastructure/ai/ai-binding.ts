export interface AiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>
}
