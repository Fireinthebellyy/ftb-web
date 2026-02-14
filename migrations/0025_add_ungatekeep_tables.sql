-- Create enum for ungatekeep post tags
CREATE TYPE "ungatekeep_tag" AS ENUM('announcement', 'company_experience', 'resources');

-- Create ungatekeep_posts table
CREATE TABLE IF NOT EXISTS "ungatekeep_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[],
	"link_url" text,
	"link_title" text,
	"link_image" text,
	"tag" "ungatekeep_tag",
	"is_pinned" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"is_subscribed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "ungatekeep_posts" ADD CONSTRAINT "ungatekeep_posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
