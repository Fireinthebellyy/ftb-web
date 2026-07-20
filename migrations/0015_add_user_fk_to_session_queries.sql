-- Migration for adding foreign key to user table in cohort_session_queries
-- Created: 2026-07-18

-- Alter user_id column from UUID to TEXT to match user table
ALTER TABLE cohort_session_queries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Add foreign key constraint to user table
ALTER TABLE cohort_session_queries 
ADD CONSTRAINT cohort_session_queries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
