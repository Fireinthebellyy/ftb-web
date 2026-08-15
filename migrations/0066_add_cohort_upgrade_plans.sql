-- Migration 0066: Add cohort_upgrade_plans table for session upgrade payment options

CREATE TABLE IF NOT EXISTS "cohort_upgrade_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cohort_id" uuid NOT NULL REFERENCES "cohorts"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "price" integer NOT NULL,
  "original_price" integer,
  "included_session_count" integer DEFAULT 1,
  "included_session_ids" jsonb DEFAULT '[]'::jsonb,
  "is_all_in_one" boolean DEFAULT false,
  "badge_text" text,
  "features" jsonb DEFAULT '[]'::jsonb,
  "order_index" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "cohort_upgrade_plans_id_cohort_unique" UNIQUE ("id", "cohort_id")
);

-- Add section_label column (safe to run on existing tables)
ALTER TABLE "cohort_upgrade_plans"
  ADD COLUMN IF NOT EXISTS "section_label" text;

-- Add unique constraint for existing table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_upgrade_plans_id_cohort_unique'
  ) THEN
    ALTER TABLE "cohort_upgrade_plans" ADD CONSTRAINT "cohort_upgrade_plans_id_cohort_unique" UNIQUE ("id", "cohort_id");
  END IF;
END $$;
