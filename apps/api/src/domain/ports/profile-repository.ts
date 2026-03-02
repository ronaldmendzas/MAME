export interface ProfileRepository {
  insertProfile(data: InsertProfileData): Promise<ProfileRecord>
  findByTokenId(tokenId: string): Promise<ProfileRecord | null>
}

export interface InsertProfileData {
  tokenId: string
  displayName: string
}

export interface ProfileRecord {
  tokenId: string
  displayName: string
  reputationScore: number
  isSuspended: boolean
  createdAt: Date
}
