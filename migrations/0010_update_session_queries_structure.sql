-- Migration for updating cohort_session_queries to session-level queries
-- Created: 2026-07-13

-- Drop the old cohort_session_queries table if it exists
DROP TABLE IF EXISTS cohort_session_queries CASCADE;

-- Create the new cohort_session_queries table for session-level questions
CREATE TABLE cohort_session_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES cohort_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_cohort_session_queries_session_id ON cohort_session_queries(session_id);
CREATE INDEX idx_cohort_session_queries_user_id ON cohort_session_queries(user_id);
