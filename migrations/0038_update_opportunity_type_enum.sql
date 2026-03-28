-- Migration to update opportunity_type enum

-- 1. Temporarily change the column type to text
ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE text;

-- 2. Update existing data to match new enum values
UPDATE "opportunities" SET "type" = 'hackathons' WHERE "type" = 'hackathon';
UPDATE "opportunities" SET "type" = 'grants_scholarships' WHERE "type" = 'grant';
UPDATE "opportunities" SET "type" = 'competitions_open_calls' WHERE "type" = 'competition';
UPDATE "opportunities" SET "type" = 'ideathon_think_tanks' WHERE "type" = 'ideathon';

-- 3. Drop the old enum type
DROP TYPE "public"."opportunity_type";

-- 4. Create the new enum type with all 10 values
CREATE TYPE "public"."opportunity_type" AS ENUM(
  'competitions_open_calls',
  'case_competitions',
  'hackathons',
  'fellowships',
  'ideathon_think_tanks',
  'leadership_programs',
  'awards_recognition',
  'grants_scholarships',
  'research_paper_ra_calls',
  'upskilling_events'
);

-- 5. Change the column type back to the new enum
ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE "public"."opportunity_type" USING "type"::"public"."opportunity_type";
