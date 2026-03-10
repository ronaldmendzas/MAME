import { Webhook } from 'svix'

export interface WebhookPayload {
  type: string
  data: Record<string, unknown>
}

export function verifyClerkWebhook(
  payload: string,
  headers: Record<string, string>,
  secret: string,
): WebhookPayload {
  const wh = new Webhook(secret)
  return wh.verify(payload, headers) as WebhookPayload
}
