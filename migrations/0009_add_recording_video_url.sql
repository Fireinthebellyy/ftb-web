-- Migration for adding video URL to cohort_session_contents
-- Created: 2026-07-13

-- Add video_url field to cohort_session_contents for recording section
ALTER TABLE cohort_session_contents 
ADD COLUMN IF NOT EXISTS video_url TEXT;
