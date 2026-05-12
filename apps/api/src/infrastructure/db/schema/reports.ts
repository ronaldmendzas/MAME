import { customType, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { reportCategoryEnum, reportStatusEnum } from './enums'
import { anonymousProfiles } from './users'

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => anonymousProfiles.tokenId),
    title: text('title').notNull(),
    body: text('body').notNull(),
    category: reportCategoryEnum('category').notNull(),
    faculty: text('faculty').notNull(),
    status: reportStatusEnum('status').notNull().default('pending'),
    votes: integer('votes').notNull().default(0),
    searchVector: tsvector('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_reports_search').using('gin', table.searchVector),
    index('idx_reports_status').on(table.category, table.status),
    index('idx_reports_created').on(table.createdAt),
    index('idx_reports_faculty').on(table.faculty, table.status),
  ],
)
