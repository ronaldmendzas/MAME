import { canAccessSecurityEvents, getRoleFromSessionClaims } from './auth-role'

describe('getRoleFromSessionClaims', () => {
  it('reads role from metadata.role', () => {
    const claims = { metadata: { role: 'auditor' } }
    expect(getRoleFromSessionClaims(claims)).toBe('auditor')
  })

  it('reads role from root role', () => {
    const claims = { role: 'admin' }
    expect(getRoleFromSessionClaims(claims)).toBe('admin')
  })

  it('reads role from public metadata role', () => {
    const claims = { publicMetadata: { role: 'moderator' } }
    expect(getRoleFromSessionClaims(claims)).toBe('moderator')
  })

  it('returns null when role is unsupported', () => {
    const claims = { metadata: { role: 'owner' } }
    expect(getRoleFromSessionClaims(claims)).toBeNull()
  })
})

describe('canAccessSecurityEvents', () => {
  it('allows admin and auditor', () => {
    expect(canAccessSecurityEvents('admin')).toBe(true)
    expect(canAccessSecurityEvents('auditor')).toBe(true)
  })

  it('denies other roles and null role', () => {
    expect(canAccessSecurityEvents('moderator')).toBe(false)
    expect(canAccessSecurityEvents('user')).toBe(false)
    expect(canAccessSecurityEvents(null)).toBe(false)
  })
})
