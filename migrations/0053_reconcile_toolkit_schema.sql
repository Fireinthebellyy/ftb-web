ALTER TABLE "toolkits"
  ADD COLUMN IF NOT EXISTS "mentorship_details" jsonb,
  ADD COLUMN IF NOT EXISTS "summary" text[],
  ADD COLUMN IF NOT EXISTS "rating" text,
  ADD COLUMN IF NOT EXISTS "subtitle" text;
--> statement-breakpoint
ALTER TABLE "toolkits"
  ALTER COLUMN "bundle_items" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "toolkits"
  ALTER COLUMN "bundle_items" SET DATA TYPE jsonb
  USING to_jsonb("bundle_items");
--> statement-breakpoint
ALTER TABLE "toolkits"
  ALTER COLUMN "bundle_items" SET DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "toolkit_community_responses"
  ADD COLUMN IF NOT EXISTS "text_response" text,
  ADD COLUMN IF NOT EXISTS "attachment_url" text,
  ADD COLUMN IF NOT EXISTS "attachment_name" text,
  ADD COLUMN IF NOT EXISTS "attachment_type" text;
--> statement-breakpoint
ALTER TABLE "toolkit_community_responses"
  ALTER COLUMN "selected_option_index" DROP NOT NULL;
