CREATE TYPE "public"."security_event_type" AS ENUM('auth_success', 'auth_failure', 'access_denied', 'sensitive_endpoint_attempt');--> statement-breakpoint
CREATE TYPE "public"."security_event_outcome" AS ENUM('allowed', 'denied', 'error');--> statement-breakpoint

CREATE TABLE "security_event_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" "security_event_type" NOT NULL,
  "outcome" "security_event_outcome" NOT NULL,
  "actor_token" uuid,
  "actor_role" text,
  "source" text NOT NULL,
  "target" text,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "security_event_log" ADD CONSTRAINT "security_event_log_actor_token_anonymous_profiles_token_id_fk" FOREIGN KEY ("actor_token") REFERENCES "public"."anonymous_profiles"("token_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_security_event_type_created" ON "security_event_log" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_security_event_actor_created" ON "security_event_log" USING btree ("actor_token","created_at");
