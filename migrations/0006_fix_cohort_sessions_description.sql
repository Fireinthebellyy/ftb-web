-- Fix cohort_sessions description column constraint
-- Created: 2026-07-12

-- Make description column nullable or set default
DO $$
BEGIN
    -- Check if description column has NOT NULL constraint
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'cohort_sessions'
        AND column_name = 'description'
        AND is_nullable = 'NO'
    ) THEN
        -- Option 1: Make it nullable
        ALTER TABLE cohort_sessions ALTER COLUMN description DROP NOT NULL;

        -- Option 2: Or set a default value (uncomment if preferred)
        -- ALTER TABLE cohort_sessions ALTER COLUMN description SET DEFAULT '';
    END IF;
END $$;
