-- Ensure sprint_features table exists
CREATE TABLE IF NOT EXISTS "sprint_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid REFERENCES "sprints"("id") ON DELETE CASCADE,
	"icon" text NOT NULL DEFAULT 'Check',
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

-- Ensure all section headings and bullet columns exist in sprints
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "highlights" text[];
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "mentors_heading" text DEFAULT 'Meet Your Mentors';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "features_heading" text DEFAULT 'What You Get';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "sessions_heading" text DEFAULT 'Sprint Sessions & Curriculum';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "testimonials_heading" text DEFAULT 'What Members Say About Our Ecosystem';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "who_is_this_for_heading" text DEFAULT 'Who Is This For?';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "who_is_this_for_bullets" text[];
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "investment_label" text DEFAULT 'Total Investment';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "faqs_heading" text DEFAULT 'Frequently Asked Questions';
ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "video_url" text;
