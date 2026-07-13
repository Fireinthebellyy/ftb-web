ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_name" text;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_college" text;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_course" text;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_year" text;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_expectations" text;
ALTER TABLE "cohort_orders" ADD COLUMN IF NOT EXISTS "registration_completed_at" timestamp;
