import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { anonymousProfiles } from './users.js'
import { reports } from './reports.js'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  tokenId: uuid('token_id')
    .notNull()
    .references(() => anonymousProfiles.tokenId),
  parentId: uuid('parent_id'),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
