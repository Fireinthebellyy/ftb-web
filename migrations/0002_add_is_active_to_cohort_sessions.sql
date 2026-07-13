-- Add is_active column to cohort_sessions table
-- Created: 2026-07-12

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'cohort_sessions'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE cohort_sessions
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;
