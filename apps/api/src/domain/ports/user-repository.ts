export interface UserRepository {
  findByClerkId(clerkId: string): Promise<UserRecord | null>
  insertUser(data: InsertUserData): Promise<UserRecord>
}

export interface InsertUserData {
  clerkId: string
  emailHash: string
  role: 'user' | 'moderator' | 'admin'
}

export interface UserRecord {
  id: string
  clerkId: string
  emailHash: string
  role: string
  createdAt: Date
}
