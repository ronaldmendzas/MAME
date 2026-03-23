export interface UserRepository {
  findByClerkId(clerkId: string): Promise<UserRecord | null>
  insertUser(data: InsertUserData): Promise<UserRecord>
  listUsers(limit: number): Promise<UserRecord[]>
  updateRole(userId: string, role: UserRole): Promise<UserRecord | null>
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'auditor'

export interface InsertUserData {
  clerkId: string
  emailHash: string
  role: UserRole
}

export interface UserRecord {
  id: string
  clerkId: string
  emailHash: string
  role: string
  createdAt: Date
}
