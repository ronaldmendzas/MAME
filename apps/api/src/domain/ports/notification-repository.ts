export type NotificationType =
  | 'status_change'
  | 'new_comment'
  | 'new_evidence'
  | 'moderator_response'
  | 'flag_threshold'

export interface NotificationRow {
  id: string
  tokenId: string
  reportId: string | null
  type: NotificationType
  message: string
  read: boolean
  createdAt: Date
}

export interface InsertNotificationData {
  tokenId: string
  reportId: string | null
  type: NotificationType
  message: string
}

export interface NotificationRepository {
  insert(data: InsertNotificationData): Promise<NotificationRow>
  findByTokenId(tokenId: string, limit: number): Promise<NotificationRow[]>
  markAsRead(id: string): Promise<void>
  countUnread(tokenId: string): Promise<number>
}
