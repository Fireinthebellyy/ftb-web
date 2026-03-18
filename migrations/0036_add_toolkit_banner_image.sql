ALTER TABLE "toolkits"
ADD COLUMN IF NOT EXISTS "banner_image_url" text;

ALTER TABLE "toolkits"
ADD COLUMN IF NOT EXISTS "testimonials" jsonb;
