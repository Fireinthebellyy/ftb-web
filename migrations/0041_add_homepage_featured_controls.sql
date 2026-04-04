ALTER TABLE "internships"
ADD COLUMN IF NOT EXISTS "is_homepage_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "homepage_feature_order" integer;

ALTER TABLE "opportunities"
ADD COLUMN IF NOT EXISTS "is_homepage_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "homepage_feature_order" integer;

CREATE INDEX IF NOT EXISTS "internships_homepage_featured_idx"
ON "internships" ("is_homepage_featured", "homepage_feature_order", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "opportunities_homepage_featured_idx"
ON "opportunities" ("is_homepage_featured", "homepage_feature_order", "created_at" DESC);
