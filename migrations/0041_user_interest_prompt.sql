ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "interest_prompt_completed_at" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "interest_areas" text[] DEFAULT '{}';

-- No auto-complete for everyone: new rows keep interest_prompt_completed_at NULL until submit.
-- The line below is idempotent on a fresh DB; it clears completed_at if there are no saved
-- interests (e.g. if an older draft migration had marked users complete without selections).
UPDATE "user"
SET "interest_prompt_completed_at" = NULL
WHERE cardinality(COALESCE("interest_areas", '{}')) = 0;
