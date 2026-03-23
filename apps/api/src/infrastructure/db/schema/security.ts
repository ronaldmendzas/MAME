import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { securityEventOutcomeEnum, securityEventTypeEnum } from './enums'
import { anonymousProfiles } from './users'

export const securityEventLog = pgTable(
  'security_event_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: securityEventTypeEnum('event_type').notNull(),
    outcome: securityEventOutcomeEnum('outcome').notNull(),
    actorToken: uuid('actor_token').references(() => anonymousProfiles.tokenId),
    actorRole: text('actor_role'),
    source: text('source').notNull(),
    target: text('target'),
    details: jsonb('details').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_security_event_type_created').on(table.eventType, table.createdAt),
    index('idx_security_event_actor_created').on(table.actorToken, table.createdAt),
  ],
)
