export type AppRole = 'user' | 'moderator' | 'admin' | 'auditor'

type RecordValue = Record<string, unknown>

export function getRoleFromSessionClaims(claims: unknown): AppRole | null {
  const roleValue = readRole(claims)
  if (roleValue === 'user') return 'user'
  if (roleValue === 'moderator') return 'moderator'
  if (roleValue === 'admin') return 'admin'
  if (roleValue === 'auditor') return 'auditor'
  return null
}

export function canAccessSecurityEvents(role: AppRole | null): boolean {
  return role === 'admin' || role === 'auditor'
}

export function canModerateReports(role: AppRole | null): boolean {
  return role === 'admin' || role === 'moderator' || role === 'auditor'
}

function readRole(claims: unknown): unknown {
  const root = asRecord(claims)
  if (!root) return null

  const metadata = asRecord(root['metadata'])
  if (metadata?.['role']) return metadata['role']

  if (root['role']) return root['role']

  const publicMetadata = asRecord(root['publicMetadata'])
  if (publicMetadata?.['role']) return publicMetadata['role']

  const unsafeMetadata = asRecord(root['unsafeMetadata'])
  if (unsafeMetadata?.['role']) return unsafeMetadata['role']

  return null
}

function asRecord(value: unknown): RecordValue | null {
  if (!value || typeof value !== 'object') return null
  return value as RecordValue
}
