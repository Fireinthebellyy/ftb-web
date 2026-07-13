-- Complete migration to fix all cohort session schema issues
-- This can be safely run even if some tables/columns already exist

-- 1. Ensure cohort_sessions table has all necessary columns
DO $$
BEGIN
  -- Add is_active if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_sessions' AND column_name='is_active') THEN
    ALTER TABLE cohort_sessions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add updated_at if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_sessions' AND column_name='updated_at') THEN
    ALTER TABLE cohort_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add created_at if not present  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_sessions' AND column_name='created_at') THEN
    ALTER TABLE cohort_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Make description nullable if it exists and is not nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_sessions' AND column_name='description' AND is_nullable='NO') THEN
    ALTER TABLE cohort_sessions ALTER COLUMN description DROP NOT NULL;
  END IF;

  -- Add description if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_sessions' AND column_name='description') THEN
    ALTER TABLE cohort_sessions ADD COLUMN description TEXT;
  END IF;
END $$;

-- 2. Ensure cohort_session_contents table has all necessary columns
DO $$
BEGIN
  -- Add updated_at if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_session_contents' AND column_name='updated_at') THEN
    ALTER TABLE cohort_session_contents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add created_at if not present  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cohort_session_contents' AND column_name='created_at') THEN
    ALTER TABLE cohort_session_contents ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cohort_sessions_cohort_id ON cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_contents_session_id ON cohort_session_contents(session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_resources_content_id ON cohort_session_resources(content_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_queries_content_id ON cohort_session_queries(content_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_mentors_content_id ON cohort_session_mentors(content_id);
