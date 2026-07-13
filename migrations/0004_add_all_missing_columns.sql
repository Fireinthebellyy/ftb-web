-- Add all missing columns to cohort session tables
-- Created: 2026-07-12

-- Add missing columns to cohort_sessions
DO $$
BEGIN
    -- Add is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_sessions' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE cohort_sessions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_sessions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE cohort_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add created_at column (just in case)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_sessions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE cohort_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to cohort_session_contents
DO $$
BEGIN
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_session_contents' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE cohort_session_contents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_session_contents' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE cohort_session_contents ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add is_unlocked column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_session_contents' AND column_name = 'is_unlocked'
    ) THEN
        ALTER TABLE cohort_session_contents ADD COLUMN is_unlocked BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add content column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_session_contents' AND column_name = 'content'
    ) THEN
        ALTER TABLE cohort_session_contents ADD COLUMN content TEXT;
    END IF;
END $$;
