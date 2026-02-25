import { relations } from 'drizzle-orm'

import { anonymousProfiles, users } from './users.js'
import { reports } from './reports.js'
import { evidence } from './evidence.js'
import { comments } from './comments.js'
import { votes } from './votes.js'
import { moderationLog, reportStatusHistory } from './moderation.js'
import { notifications } from './notifications.js'
import { flags } from './flags.js'

export const usersRelations = relations(users, ({ many }) => ({
  moderationLogs: many(moderationLog),
  statusChanges: many(reportStatusHistory),
}))

export const anonymousProfilesRelations = relations(anonymousProfiles, ({ many }) => ({
  reports: many(reports),
  comments: many(comments),
  votes: many(votes),
  notifications: many(notifications),
  flags: many(flags),
}))

export const reportsRelations = relations(reports, ({ one, many }) => ({
  author: one(anonymousProfiles, {
    fields: [reports.tokenId],
    references: [anonymousProfiles.tokenId],
  }),
  evidence: many(evidence),
  comments: many(comments),
  votes: many(votes),
  moderationLogs: many(moderationLog),
  statusHistory: many(reportStatusHistory),
  flags: many(flags),
}))

export const evidenceRelations = relations(evidence, ({ one }) => ({
  report: one(reports, {
    fields: [evidence.reportId],
    references: [reports.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  report: one(reports, {
    fields: [comments.reportId],
    references: [reports.id],
  }),
  author: one(anonymousProfiles, {
    fields: [comments.tokenId],
    references: [anonymousProfiles.tokenId],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
}))

export const votesRelations = relations(votes, ({ one }) => ({
  report: one(reports, {
    fields: [votes.reportId],
    references: [reports.id],
  }),
  voter: one(anonymousProfiles, {
    fields: [votes.tokenId],
    references: [anonymousProfiles.tokenId],
  }),
}))

export const moderationLogRelations = relations(moderationLog, ({ one }) => ({
  report: one(reports, {
    fields: [moderationLog.reportId],
    references: [reports.id],
  }),
  moderator: one(users, {
    fields: [moderationLog.moderatorId],
    references: [users.id],
  }),
}))

export const reportStatusHistoryRelations = relations(reportStatusHistory, ({ one }) => ({
  report: one(reports, {
    fields: [reportStatusHistory.reportId],
    references: [reports.id],
  }),
  changedBy: one(users, {
    fields: [reportStatusHistory.changedBy],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(anonymousProfiles, {
    fields: [notifications.tokenId],
    references: [anonymousProfiles.tokenId],
  }),
}))

export const flagsRelations = relations(flags, ({ one }) => ({
  report: one(reports, {
    fields: [flags.reportId],
    references: [reports.id],
  }),
  flagger: one(anonymousProfiles, {
    fields: [flags.tokenId],
    references: [anonymousProfiles.tokenId],
  }),
}))
