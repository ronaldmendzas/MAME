import { describe, expect, it } from 'vitest'

import * as schema from '../../src/infrastructure/db/schema/index'

describe('schema barrel export', () => {
  it('exports all 7 enums', () => {
    expect(schema.reportCategoryEnum).toBeDefined()
    expect(schema.reportStatusEnum).toBeDefined()
    expect(schema.userRoleEnum).toBeDefined()
    expect(schema.evidenceTypeEnum).toBeDefined()
    expect(schema.moderationActionEnum).toBeDefined()
    expect(schema.flagCategoryEnum).toBeDefined()
    expect(schema.notificationTypeEnum).toBeDefined()
  })

  it('exports all 11 tables', () => {
    expect(schema.users).toBeDefined()
    expect(schema.anonymousProfiles).toBeDefined()
    expect(schema.identityLinks).toBeDefined()
    expect(schema.reports).toBeDefined()
    expect(schema.evidence).toBeDefined()
    expect(schema.comments).toBeDefined()
    expect(schema.votes).toBeDefined()
    expect(schema.moderationLog).toBeDefined()
    expect(schema.reportStatusHistory).toBeDefined()
    expect(schema.notifications).toBeDefined()
    expect(schema.flags).toBeDefined()
  })

  it('exports all relations', () => {
    expect(schema.usersRelations).toBeDefined()
    expect(schema.anonymousProfilesRelations).toBeDefined()
    expect(schema.reportsRelations).toBeDefined()
    expect(schema.evidenceRelations).toBeDefined()
    expect(schema.commentsRelations).toBeDefined()
    expect(schema.votesRelations).toBeDefined()
    expect(schema.moderationLogRelations).toBeDefined()
    expect(schema.reportStatusHistoryRelations).toBeDefined()
    expect(schema.notificationsRelations).toBeDefined()
    expect(schema.flagsRelations).toBeDefined()
  })
})
