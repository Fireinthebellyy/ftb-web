-- Migration: Add selected_upgrade_plan_id to cohort_orders
ALTER TABLE "cohort_orders" 
ADD COLUMN IF NOT EXISTS "selected_upgrade_plan_id" uuid REFERENCES "cohort_upgrade_plans"("id") ON DELETE SET NULL;
