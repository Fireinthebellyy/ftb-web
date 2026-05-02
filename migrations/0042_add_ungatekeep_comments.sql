CREATE TABLE IF NOT EXISTS "ungatekeep_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ungatekeep_comments" ADD CONSTRAINT "ungatekeep_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ungatekeep_comments" ADD CONSTRAINT "ungatekeep_comments_post_id_ungatekeep_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "ungatekeep_posts"("id") ON DELETE cascade ON UPDATE no action;
