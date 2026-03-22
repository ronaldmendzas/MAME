export interface CommentRow {
  id: string
  reportId: string
  tokenId: string
  parentId: string | null
  body: string
  createdAt: Date
}

export interface InsertCommentData {
  reportId: string
  tokenId: string
  parentId: string | null
  body: string
}

export interface CommentRepository {
  insert(data: InsertCommentData): Promise<CommentRow>
  findByReportId(reportId: string): Promise<CommentRow[]>
  findById(id: string): Promise<CommentRow | null>
  deleteById(id: string): Promise<void>
  countByReportId(reportId: string): Promise<number>
}
