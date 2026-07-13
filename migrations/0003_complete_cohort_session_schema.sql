-- Complete migration for cohort session schema
-- Created: 2026-07-12

-- Create cohort_sessions table if not exists
CREATE TABLE IF NOT EXISTS cohort_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cohort_sessions' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE cohort_sessions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Create cohort_session_contents table if not exists
CREATE TABLE IF NOT EXISTS cohort_session_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cohort_sessions(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_unlocked BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohort_session_resources table if not exists
CREATE TABLE IF NOT EXISTS cohort_session_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES cohort_session_contents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'file',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohort_session_queries table if not exists
CREATE TABLE IF NOT EXISTS cohort_session_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES cohort_session_contents(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohort_session_mentors table if not exists
CREATE TABLE IF NOT EXISTS cohort_session_mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES cohort_session_contents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    image_url TEXT,
    bio TEXT,
    linkedin_url TEXT,
    other_links JSONB NOT NULL DEFAULT '[]',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_cohort_sessions_cohort_id ON cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_contents_session_id ON cohort_session_contents(session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_resources_content_id ON cohort_session_resources(content_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_queries_content_id ON cohort_session_queries(content_id);
CREATE INDEX IF NOT EXISTS idx_cohort_session_mentors_content_id ON cohort_session_mentors(content_id);
