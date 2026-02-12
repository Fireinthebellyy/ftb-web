ALTER TABLE "internships" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
UPDATE "internships" SET "link" = 'https://example.com' WHERE "link" IS NULL;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "type" SET DATA TYPE text USING CASE
  WHEN "type"::text = 'work-from-home' THEN 'remote'
  WHEN "type"::text = 'in-office' THEN 'onsite'
  WHEN "type"::text = 'hybrid' THEN 'hybrid'
  ELSE NULL
END;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "timing" SET DATA TYPE text USING CASE
  WHEN "timing"::text = 'full-time' THEN 'full_time'
  WHEN "timing"::text = 'part-time' THEN 'part_time'
  WHEN "timing"::text = 'shift-based' THEN 'part_time'
  ELSE NULL
END;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "timing" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ALTER COLUMN "link" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "poster";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "tag_ids";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "hiring_manager_email";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "eligibility";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "is_flagged";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "application_count";--> statement-breakpoint
DO $$ BEGIN
  DROP TYPE IF EXISTS "public"."internship_type";
EXCEPTION
  WHEN dependent_objects_still_exist THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  DROP TYPE IF EXISTS "public"."internship_timing";
EXCEPTION
  WHEN dependent_objects_still_exist THEN NULL;
END $$;
