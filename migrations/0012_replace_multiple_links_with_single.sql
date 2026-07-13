-- Replace multiple link fields with single live_session_link field
ALTER TABLE cohort_session_contents DROP COLUMN IF EXISTS zoom_link;
ALTER TABLE cohort_session_contents DROP COLUMN IF EXISTS google_meet_link;
ALTER TABLE cohort_session_contents DROP COLUMN IF EXISTS whatsapp_community_link;
ALTER TABLE cohort_session_contents ADD COLUMN live_session_link TEXT;
