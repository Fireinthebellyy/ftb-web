ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_whatsapp_link" text;
ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_meet_link" text;
ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_date" timestamp;
ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_questions" jsonb DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS "session_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "toolkit_id" uuid NOT NULL REFERENCES "toolkits"("id") ON DELETE CASCADE,
  "answers" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);
