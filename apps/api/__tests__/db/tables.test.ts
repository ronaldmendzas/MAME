import { describe, expect, it } from 'vitest'
import { getTableColumns } from 'drizzle-orm'

import { users, anonymousProfiles, identityLinks } from '../../src/infrastructure/db/schema/users'
import { reports } from '../../src/infrastructure/db/schema/reports'
import { evidence } from '../../src/infrastructure/db/schema/evidence'
import { comments } from '../../src/infrastructure/db/schema/comments'
import { votes } from '../../src/infrastructure/db/schema/votes'
import { moderationLog, reportStatusHistory } from '../../src/infrastructure/db/schema/moderation'
import { notifications } from '../../src/infrastructure/db/schema/notifications'
import { flags } from '../../src/infrastructure/db/schema/flags'

describe('schema tables', () => {
  it('users has 8 columns', () => {
    const cols = getTableColumns(users)
    expect(Object.keys(cols)).toHaveLength(8)
    expect(cols.id).toBeDefined()
    expect(cols.clerkId).toBeDefined()
    expect(cols.role).toBeDefined()
  })

  it('anonymousProfiles has 5 columns', () => {
    const cols = getTableColumns(anonymousProfiles)
    expect(Object.keys(cols)).toHaveLength(5)
    expect(cols.tokenId).toBeDefined()
    expect(cols.reputationScore).toBeDefined()
  })

  it('identityLinks has 5 columns', () => {
    const cols = getTableColumns(identityLinks)
    expect(Object.keys(cols)).toHaveLength(5)
    expect(cols.relationProof).toBeDefined()
  })

  it('reports has 12 columns', () => {
    const cols = getTableColumns(reports)
    expect(Object.keys(cols)).toHaveLength(12)
    expect(cols.searchVector).toBeDefined()
    expect(cols.publishedAt).toBeDefined()
  })

  it('evidence has 7 columns', () => {
    const cols = getTableColumns(evidence)
    expect(Object.keys(cols)).toHaveLength(7)
    expect(cols.fileKey).toBeDefined()
    expect(cols.sizeBytes).toBeDefined()
  })

  it('comments has 7 columns', () => {
    const cols = getTableColumns(comments)
    expect(Object.keys(cols)).toHaveLength(7)
    expect(cols.parentId).toBeDefined()
  })

  it('votes has 4 columns', () => {
    const cols = getTableColumns(votes)
    expect(Object.keys(cols)).toHaveLength(4)
  })

  it('moderationLog has 6 columns', () => {
    const cols = getTableColumns(moderationLog)
    expect(Object.keys(cols)).toHaveLength(6)
    expect(cols.action).toBeDefined()
    expect(cols.moderatorToken).toBeDefined()
  })

  it('reportStatusHistory has 7 columns', () => {
    const cols = getTableColumns(reportStatusHistory)
    expect(Object.keys(cols)).toHaveLength(7)
    expect(cols.oldStatus).toBeDefined()
    expect(cols.newStatus).toBeDefined()
    expect(cols.changedByToken).toBeDefined()
    expect(cols.reason).toBeDefined()
  })

  it('notifications has 8 columns', () => {
    const cols = getTableColumns(notifications)
    expect(Object.keys(cols)).toHaveLength(8)
    expect(cols.payload).toBeDefined()
    expect(cols.read).toBeDefined()
    expect(cols.reportId).toBeDefined()
    expect(cols.message).toBeDefined()
  })

  it('flags has 6 columns', () => {
    const cols = getTableColumns(flags)
    expect(Object.keys(cols)).toHaveLength(6)
    expect(cols.category).toBeDefined()
  })
})
