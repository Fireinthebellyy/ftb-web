-- Add cohort_session_mentors table with nullable cohort_mentor_id FK and nullable name
-- Safe for existing data: cohort_mentor_id is nullable (ON DELETE SET NULL), name drops NOT NULL

CREATE TABLE IF NOT EXISTS "cohort_session_mentors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_id" uuid NOT NULL REFERENCES "cohort_session_contents"("id") ON DELETE CASCADE,
  "cohort_mentor_id" uuid REFERENCES "cohort_mentors"("id") ON DELETE SET NULL,
  "name" text,
  "role" text,
  "image_url" text,
  "bio" text,
  "linkedin_url" text,
  "other_links" jsonb DEFAULT '[]'::jsonb,
  "order_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);
