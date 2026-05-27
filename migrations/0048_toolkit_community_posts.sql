CREATE TABLE IF NOT EXISTS "toolkit_community_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "toolkit_id" uuid NOT NULL,
  "type" text DEFAULT 'text' NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "options" jsonb DEFAULT '[]'::jsonb,
  "attachment_url" text,
  "attachment_name" text,
  "attachment_type" text,
  "order_index" integer DEFAULT 0 NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "toolkit_community_posts"
  ADD CONSTRAINT "toolkit_community_posts_toolkit_id_toolkits_id_fk"
  FOREIGN KEY ("toolkit_id")
  REFERENCES "public"."toolkits"("id")
  ON DELETE cascade
  ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
