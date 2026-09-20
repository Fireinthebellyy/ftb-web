CREATE TABLE IF NOT EXISTS "sprint_faqs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sprint_id" uuid REFERENCES "sprints"("id") ON DELETE cascade,
  "question" text NOT NULL,
  "answer" text,
  "image_url" text,
  "order_index" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "sprints" ADD COLUMN IF NOT EXISTS "faqs_heading" text DEFAULT 'Frequently Asked Questions';
