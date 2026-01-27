ALTER TABLE "opportunities" ADD COLUMN "upvoter_ids" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "upvote_count" integer DEFAULT 0;