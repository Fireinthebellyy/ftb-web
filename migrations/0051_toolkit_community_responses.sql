CREATE TABLE IF NOT EXISTS "toolkit_community_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "selected_option_index" integer NOT NULL,
  "created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "toolkit_community_responses"
  ADD CONSTRAINT "toolkit_community_responses_post_id_fkey"
  FOREIGN KEY ("post_id")
  REFERENCES "public"."toolkit_community_posts"("id")
  ON DELETE cascade
  ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "toolkit_community_responses"
  ADD CONSTRAINT "toolkit_community_responses_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."user"("id")
  ON DELETE cascade
  ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "toolkit_community_responses_post_user_unique"
  ON "toolkit_community_responses" ("post_id", "user_id");

CREATE INDEX IF NOT EXISTS "toolkit_community_responses_post_id_idx"
  ON "toolkit_community_responses" ("post_id");
