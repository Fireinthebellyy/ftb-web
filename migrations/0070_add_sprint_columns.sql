ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "video_url" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "toolkit_sprints_tab_label" text DEFAULT 'Sprints';
