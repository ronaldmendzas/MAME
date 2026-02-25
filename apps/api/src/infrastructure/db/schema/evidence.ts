import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { evidenceTypeEnum } from './enums.js'
import { reports } from './reports.js'

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  type: evidenceTypeEnum('type').notNull(),
  fileKey: text('file_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
