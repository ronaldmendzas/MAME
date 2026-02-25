import { describe, expect, it } from 'vitest'

import {
  reportCategoryEnum,
  reportStatusEnum,
  userRoleEnum,
  evidenceTypeEnum,
  moderationActionEnum,
  flagCategoryEnum,
  notificationTypeEnum,
} from '../../src/infrastructure/db/schema/enums'

describe('schema enums', () => {
  it('reportCategoryEnum has 8 values', () => {
    expect(reportCategoryEnum.enumValues).toHaveLength(8)
    expect(reportCategoryEnum.enumValues).toContain('sexual-harassment')
    expect(reportCategoryEnum.enumValues).toContain('other')
  })

  it('reportStatusEnum has 7 values', () => {
    expect(reportStatusEnum.enumValues).toHaveLength(7)
    expect(reportStatusEnum.enumValues).toContain('draft')
    expect(reportStatusEnum.enumValues).toContain('resolved')
  })

  it('userRoleEnum has 3 values', () => {
    expect(userRoleEnum.enumValues).toEqual(['user', 'moderator', 'admin'])
  })

  it('evidenceTypeEnum has 2 values', () => {
    expect(evidenceTypeEnum.enumValues).toEqual(['file', 'external_link'])
  })

  it('moderationActionEnum has 4 values', () => {
    expect(moderationActionEnum.enumValues).toHaveLength(4)
    expect(moderationActionEnum.enumValues).toContain('approve')
    expect(moderationActionEnum.enumValues).toContain('escalate')
  })

  it('flagCategoryEnum has 5 values', () => {
    expect(flagCategoryEnum.enumValues).toHaveLength(5)
    expect(flagCategoryEnum.enumValues).toContain('false_report')
  })

  it('notificationTypeEnum has 5 values', () => {
    expect(notificationTypeEnum.enumValues).toHaveLength(5)
    expect(notificationTypeEnum.enumValues).toContain('status_change')
  })
})
