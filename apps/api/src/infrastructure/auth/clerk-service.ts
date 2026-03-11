import type { ClerkService } from '../../domain/ports/clerk-service'

export function createClerkService(secretKey: string): ClerkService {
  const baseUrl = 'https://api.clerk.com/v1'

  return {
    updateUserMetadata: async (clerkUserId, tokenId) => {
      const response = await fetch(`${baseUrl}/users/${clerkUserId}/metadata`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: { token_id: tokenId },
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Clerk metadata update failed: ${response.status} ${text}`)
      }
    },

    getUser: async (clerkUserId) => {
      const response = await fetch(`${baseUrl}/users/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })

      if (!response.ok) {
        throw new Error(`Clerk user fetch failed: ${response.status}`)
      }

      const data = (await response.json()) as {
        email_addresses?: Array<{ email_address: string }>
      }
      const email = data.email_addresses?.[0]?.email_address
      if (!email) throw new Error('No email found for Clerk user')

      return { email }
    },
  }
}
