import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { moderationActionEnum, reportStatusEnum } from './enums'
import { reports } from './reports'
import { anonymousProfiles } from './users'

export const moderationLog = pgTable('moderation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  moderatorToken: uuid('moderator_token')
    .notNull()
    .references(() => anonymousProfiles.tokenId),
  action: moderationActionEnum('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reportStatusHistory = pgTable('report_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  oldStatus: reportStatusEnum('old_status').notNull(),
  newStatus: reportStatusEnum('new_status').notNull(),
  changedByToken: uuid('changed_by_token')
    .notNull()
    .references(() => anonymousProfiles.tokenId),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
