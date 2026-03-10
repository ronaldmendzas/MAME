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
  }
}
