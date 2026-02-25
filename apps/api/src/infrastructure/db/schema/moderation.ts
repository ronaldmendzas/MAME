import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { moderationActionEnum, reportStatusEnum } from './enums.js'
import { reports } from './reports.js'
import { users } from './users.js'

export const moderationLog = pgTable('moderation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  moderatorId: uuid('moderator_id')
    .notNull()
    .references(() => users.id),
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
  changedBy: uuid('changed_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
