CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_user_id" text,
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "method" text NOT NULL,
  "path" text NOT NULL,
  "status_code" integer NOT NULL,
  "success" boolean DEFAULT false NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "request_id" text,
  "metadata" jsonb,
  "before_state" jsonb,
  "after_state" jsonb,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_user_id_user_id_fk"
    FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "admin_activity_logs_admin_user_id_idx"
  ON "admin_activity_logs" ("admin_user_id");

CREATE INDEX IF NOT EXISTS "admin_activity_logs_action_idx"
  ON "admin_activity_logs" ("action");

CREATE INDEX IF NOT EXISTS "admin_activity_logs_created_at_idx"
  ON "admin_activity_logs" ("created_at");
