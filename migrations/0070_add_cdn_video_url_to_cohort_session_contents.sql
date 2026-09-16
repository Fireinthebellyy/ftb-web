-- Migration: Add cdn_video_url to cohort_session_contents
ALTER TABLE "cohort_session_contents"
ADD COLUMN IF NOT EXISTS "cdn_video_url" text;
