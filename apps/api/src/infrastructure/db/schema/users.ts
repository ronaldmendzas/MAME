import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { userRoleEnum } from './enums'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  emailHash: text('email_hash').notNull().unique(),
  role: userRoleEnum('role').notNull().default('user'),
  faculty: text('faculty'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const anonymousProfiles = pgTable('anonymous_profiles', {
  tokenId: uuid('token_id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  reputationScore: integer('reputation_score').notNull().default(0),
  isSuspended: boolean('is_suspended').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const identityLinks = pgTable('identity_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailHash: text('email_hash').notNull(),
  tokenId: text('token_id').notNull(),
  relationProof: text('relation_proof').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
