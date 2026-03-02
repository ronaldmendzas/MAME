ALTER TYPE "public"."moderation_action" ADD VALUE 'edit';--> statement-breakpoint
ALTER TABLE "moderation_log" DROP CONSTRAINT "moderation_log_moderator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "report_status_history" DROP CONSTRAINT "report_status_history_changed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "moderation_log" ADD COLUMN "moderator_token" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD COLUMN "changed_by_token" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "report_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "message" text NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_moderator_token_anonymous_profiles_token_id_fk" FOREIGN KEY ("moderator_token") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changed_by_token_anonymous_profiles_token_id_fk" FOREIGN KEY ("changed_by_token") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_evidence_report" ON "evidence" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_comments_report" ON "comments" USING btree ("report_id");--> statement-breakpoint
ALTER TABLE "moderation_log" DROP COLUMN "moderator_id";--> statement-breakpoint
ALTER TABLE "report_status_history" DROP COLUMN "changed_by";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "title";