import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'

export const localAuthCredentials = pgTable('local_auth_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  loginHash: text('login_hash').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordAlgo: text('password_algo').notNull().default('pbkdf2-sha256'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  mfaSecretCiphertext: text('mfa_secret_ciphertext'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
