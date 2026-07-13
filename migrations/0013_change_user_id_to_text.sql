-- Change userId from uuid to text in cohort_session_queries
ALTER TABLE cohort_session_queries ALTER COLUMN user_id TYPE text USING user_id::text;
