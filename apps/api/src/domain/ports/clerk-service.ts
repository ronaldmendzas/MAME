export interface ClerkUser {
  email: string
  tokenId?: string
}

export interface ClerkService {
  updateUserMetadata(clerkUserId: string, tokenId: string): Promise<void>
  getUser(clerkUserId: string): Promise<ClerkUser>
}
