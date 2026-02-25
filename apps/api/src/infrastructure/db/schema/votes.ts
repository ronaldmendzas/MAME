import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { reports } from './reports.js'
import { anonymousProfiles } from './users.js'

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => anonymousProfiles.tokenId),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('uq_votes_report_token').on(table.reportId, table.tokenId)],
)
