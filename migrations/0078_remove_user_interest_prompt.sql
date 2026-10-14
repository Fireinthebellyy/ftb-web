-- Remove post-signup "What are you interested in?" prompt columns from user table
ALTER TABLE "user" DROP COLUMN IF EXISTS "interest_prompt_completed_at";
ALTER TABLE "user" DROP COLUMN IF EXISTS "interest_areas";
