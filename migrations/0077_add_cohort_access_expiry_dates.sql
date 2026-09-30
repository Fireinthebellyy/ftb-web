ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "standard_access_expiry" timestamp;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "extended_access_expiry" timestamp;

UPDATE "cohorts" 
SET 
  "standard_access_expiry" = '2026-10-07 23:59:59',
  "extended_access_expiry" = '2026-11-07 23:59:59'
WHERE "standard_access_expiry" IS NULL;
