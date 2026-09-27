ALTER TABLE "sprint_tiers"
ADD COLUMN "is_filling_fast" boolean DEFAULT false;

ALTER TABLE "sprint_tiers"
ADD COLUMN "is_trending" boolean DEFAULT false;
