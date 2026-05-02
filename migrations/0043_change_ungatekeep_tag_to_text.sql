-- Migration to change ungatekeepPosts.tag from enum to text
ALTER TABLE "ungatekeep_posts" ALTER COLUMN "tag" SET DATA TYPE text;

-- Optional: You can also drop the enum if it's no longer used anywhere else
-- DROP TYPE "ungatekeep_tag";
