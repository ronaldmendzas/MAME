CREATE TYPE "public"."evidence_type" AS ENUM('file', 'external_link');--> statement-breakpoint
CREATE TYPE "public"."flag_category" AS ENUM('false_report', 'inappropriate', 'exposed_data', 'harassment', 'other');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('approve', 'reject', 'request_info', 'escalate');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('status_change', 'new_comment', 'new_evidence', 'moderator_response', 'flag_threshold');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('sexual-harassment', 'academic-corruption', 'faculty-plagiarism', 'discrimination', 'nepotism', 'administrative-irregularities', 'fraud', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('draft', 'pending', 'under_review', 'published', 'rejected', 'archived', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "anonymous_profiles" (
	"token_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" text NOT NULL,
	"token_id" text NOT NULL,
	"relation_proof" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"faculty" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" "report_category" NOT NULL,
	"faculty" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"search_vector" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"type" "evidence_type" NOT NULL,
	"file_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"token_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"token_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_votes_report_token" UNIQUE("report_id","token_id")
);
--> statement-breakpoint
CREATE TABLE "moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" "moderation_action" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"old_status" "report_status" NOT NULL,
	"new_status" "report_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"token_id" uuid NOT NULL,
	"category" "flag_category" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_flags_report_token" UNIQUE("report_id","token_id")
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_token_id_anonymous_profiles_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_token_id_anonymous_profiles_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_token_id_anonymous_profiles_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_token_id_anonymous_profiles_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_token_id_anonymous_profiles_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reports_search" ON "reports" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("category","status");--> statement-breakpoint
CREATE INDEX "idx_reports_created" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_faculty" ON "reports" USING btree ("faculty","status");