-- Migration for adding live session links to cohort_session_contents
-- Created: 2026-07-13

-- Add Zoom, Google Meet, and WhatsApp Community link fields to cohort_session_contents
ALTER TABLE cohort_session_contents 
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_community_link TEXT;
