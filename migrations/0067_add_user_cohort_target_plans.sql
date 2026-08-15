-- Migration 0067: Add user_cohort_target_plans table for admin package targeting toggles per registrant

CREATE TABLE IF NOT EXISTS "user_cohort_target_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "cohort_id" uuid NOT NULL REFERENCES "cohorts"("id") ON DELETE CASCADE,
  "plan_id" uuid NOT NULL,
  "is_enabled" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "user_cohort_target_plans_user_cohort_plan_unique" UNIQUE ("user_id", "cohort_id", "plan_id"),
  CONSTRAINT "user_cohort_target_plans_plan_cohort_fk" FOREIGN KEY ("plan_id", "cohort_id") REFERENCES "cohort_upgrade_plans"("id", "cohort_id") ON DELETE CASCADE
);
