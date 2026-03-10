export type ReportCategory =
  | 'sexual-harassment'
  | 'academic-corruption'
  | 'faculty-plagiarism'
  | 'discrimination'
  | 'nepotism'
  | 'administrative-irregularities'
  | 'fraud'
  | 'other'

export type ReportStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'resolved'

export type UserRole = 'user' | 'moderator' | 'admin'

export type EvidenceType = 'file' | 'external_link'
