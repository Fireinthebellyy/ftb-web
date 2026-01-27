-- Migration: Update internships table
-- This migration includes all schema changes:
-- 1. Create internship_type enum type (if it doesn't exist)
-- 2. Create internship_timing enum type (if it doesn't exist)
-- 3. Add timing column to internships table
-- 4. Add new columns: experience, eligibility, hiring_manager_email
-- 5. Make poster column NOT NULL (company logo is now mandatory)

-- IMPORTANT: Before running this migration, ensure all existing rows have a poster value
-- If there are NULL values in poster column, update them first:
-- UPDATE internships SET poster = 'https://placeholder.com/logo.png' WHERE poster IS NULL;

-- Step 1: Create internship_type enum type (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE internship_type AS ENUM ('in-office', 'work-from-home', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create internship_timing enum type (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE internship_timing AS ENUM ('full-time', 'part-time', 'shift-based');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add timing column to internships table (if it doesn't exist)
-- IMPORTANT: If there are existing rows, update them first:
-- UPDATE internships SET timing = 'full-time' WHERE timing IS NULL;
-- Then add the column as NOT NULL
ALTER TABLE internships 
  ADD COLUMN IF NOT EXISTS timing internship_timing;

-- Make timing column NOT NULL (mandatory)
-- Note: This will fail if there are any NULL values. Update them first if needed.
ALTER TABLE internships 
  ALTER COLUMN timing SET NOT NULL;

-- Step 4: Update type column to use internship_type enum (if needed)
-- If type column exists with different type, you may need to:
-- ALTER TABLE internships ALTER COLUMN type TYPE internship_type USING type::internship_type;

-- Step 5: Add new columns (if they don't exist)
ALTER TABLE internships 
  ADD COLUMN IF NOT EXISTS experience text;

ALTER TABLE internships 
  ADD COLUMN IF NOT EXISTS eligibility text;

ALTER TABLE internships 
  ADD COLUMN IF NOT EXISTS hiring_manager_email text;

-- Step 6: Make poster column NOT NULL
-- Note: This will fail if there are any NULL values. Update them first if needed.
ALTER TABLE internships 
  ALTER COLUMN poster SET NOT NULL;

