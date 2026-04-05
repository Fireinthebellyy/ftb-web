ALTER TABLE "internships"
ADD COLUMN IF NOT EXISTS "is_homepage_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "homepage_feature_order" integer;

UPDATE "internships"
SET "is_homepage_featured" = false
WHERE "is_homepage_featured" IS NULL;

ALTER TABLE "internships"
ALTER COLUMN "is_homepage_featured" SET DEFAULT false,
ALTER COLUMN "is_homepage_featured" SET NOT NULL;

ALTER TABLE "opportunities"
ADD COLUMN IF NOT EXISTS "is_homepage_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "homepage_feature_order" integer;

UPDATE "opportunities"
SET "is_homepage_featured" = false
WHERE "is_homepage_featured" IS NULL;

ALTER TABLE "opportunities"
ALTER COLUMN "is_homepage_featured" SET DEFAULT false,
ALTER COLUMN "is_homepage_featured" SET NOT NULL;

ALTER TABLE "tracker_items"
ADD COLUMN IF NOT EXISTS "snapshot_deadline" text;
