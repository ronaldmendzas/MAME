import { Hono } from 'hono'

import { registerUser } from '../../application/register-user.js'
import type { AppEnv } from '../../env.js'
import { createClerkService } from '../../infrastructure/auth/clerk-service.js'
import { createCryptoService } from '../../infrastructure/auth/crypto-service.js'
import { verifyClerkWebhook } from '../../infrastructure/auth/webhook-verify.js'
import { createDb } from '../../infrastructure/db/connection.js'
import { createIdentityLinkRepository } from '../../infrastructure/db/identity-link-repository.js'
import { createProfileRepository } from '../../infrastructure/db/profile-repository.js'
import { createUserRepository } from '../../infrastructure/db/user-repository.js'

const webhooks = new Hono<AppEnv>()

webhooks.post('/clerk', async (c) => {
  const body = await c.req.text()
  const svixId = c.req.header('svix-id') ?? ''
  const svixTimestamp = c.req.header('svix-timestamp') ?? ''
  const svixSignature = c.req.header('svix-signature') ?? ''

  const headers = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = verifyClerkWebhook(body, headers, c.env.CLERK_WEBHOOK_SECRET)
  } catch {
    return c.json({ error: 'Invalid webhook signature' }, 401)
  }

  if (event.type !== 'user.created') {
    return c.json({ received: true })
  }

  const data = event.data
  const clerkId = data['id'] as string
  const emails = data['email_addresses'] as Array<{ email_address: string }> | undefined
  const primaryId = data['primary_email_address_id'] as string | undefined
  const email = extractPrimaryEmail(emails, primaryId)

  if (!clerkId || !email) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const db = createDb(c.env.DATABASE_URL)
  const result = await registerUser(
    { clerkId, email },
    {
      userRepo: createUserRepository(db),
      profileRepo: createProfileRepository(db),
      linkRepo: createIdentityLinkRepository(db),
      cryptoService: createCryptoService(
        c.env.ENCRYPTION_MASTER_KEY,
        c.env.ENCRYPTION_RELATION_KEY,
      ),
      clerkService: createClerkService(c.env.CLERK_SECRET_KEY),
    },
  )

  const status = result.isNew ? 201 : 200
  return c.json({ received: true, userId: result.userId }, status)
})

function extractPrimaryEmail(
  addresses: Array<{ email_address: string }> | undefined,
  primaryId: string | undefined,
): string | undefined {
  if (!addresses?.length) return undefined
  if (!primaryId) return addresses[0]?.email_address
  const primary = addresses.find(
    (a) => (a as Record<string, unknown>)['id'] === primaryId,
  )
  return primary?.email_address ?? addresses[0]?.email_address
}

export { webhooks }
