import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { notificationTypeEnum } from './enums'
import { anonymousProfiles } from './users'

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id')
    .notNull()
    .references(() => anonymousProfiles.tokenId),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  payload: jsonb('payload').notNull().default({}),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
