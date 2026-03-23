CREATE OR REPLACE FUNCTION "public"."prevent_audit_log_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only and cannot be modified';
END;
$$;
--> statement-breakpoint

CREATE TRIGGER "trg_no_update_moderation_log"
BEFORE UPDATE ON "public"."moderation_log"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
--> statement-breakpoint

CREATE TRIGGER "trg_no_delete_moderation_log"
BEFORE DELETE ON "public"."moderation_log"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
--> statement-breakpoint

CREATE TRIGGER "trg_no_update_report_status_history"
BEFORE UPDATE ON "public"."report_status_history"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
--> statement-breakpoint

CREATE TRIGGER "trg_no_delete_report_status_history"
BEFORE DELETE ON "public"."report_status_history"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
--> statement-breakpoint

CREATE TRIGGER "trg_no_update_security_event_log"
BEFORE UPDATE ON "public"."security_event_log"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
--> statement-breakpoint

CREATE TRIGGER "trg_no_delete_security_event_log"
BEFORE DELETE ON "public"."security_event_log"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
