-- Add locked_message column to cohort_session_contents table
ALTER TABLE cohort_session_contents ADD COLUMN locked_message TEXT;
