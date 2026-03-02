export interface ClerkService {
  updateUserMetadata(
    clerkUserId: string,
    tokenId: string,
  ): Promise<void>
}
