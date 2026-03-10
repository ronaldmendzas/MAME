import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { flagCategoryEnum } from './enums'
import { reports } from './reports'
import { anonymousProfiles } from './users'

export const flags = pgTable(
  'flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => anonymousProfiles.tokenId),
    category: flagCategoryEnum('category').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('uq_flags_report_token').on(table.reportId, table.tokenId)],
)
