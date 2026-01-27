-- Migration: Change eligibility column from text to text array
-- This migration converts the eligibility column from text to text array

-- Step 1: If eligibility column exists as text, convert existing data to array
-- First, handle existing text data by converting comma-separated strings to arrays
DO $$ 
BEGIN
  -- Check if column exists and is text type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'internships' 
    AND column_name = 'eligibility'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text values to arrays
    -- If value is NULL or empty, set to empty array
    -- If value contains commas, split into array
    -- Otherwise, wrap single value in array
    UPDATE internships
    SET eligibility = CASE
      WHEN eligibility IS NULL OR eligibility = '' THEN '{}'
      WHEN eligibility LIKE '%,%' THEN 
        ARRAY(SELECT trim(unnest(string_to_array(eligibility, ','))))
      ELSE ARRAY[eligibility]
    END::text[]
    WHERE eligibility IS NOT NULL;
  END IF;
END $$;

-- Step 2: Change column type to text array
ALTER TABLE internships 
  ALTER COLUMN eligibility TYPE text[] USING 
    CASE 
      WHEN eligibility IS NULL THEN ARRAY[]::text[]
      WHEN eligibility::text = '' THEN ARRAY[]::text[]
      ELSE ARRAY[eligibility::text]
    END;

-- Set default to empty array if not already set
ALTER TABLE internships 
  ALTER COLUMN eligibility SET DEFAULT '{}';

