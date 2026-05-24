CREATE TABLE "ungatekeep_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ungatekeep_post_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"vote" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ALTER COLUMN "tag" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "filter_tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD COLUMN "toolkit_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "interest_prompt_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "interest_areas" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "login_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_date" date;--> statement-breakpoint
ALTER TABLE "ungatekeep_comments" ADD CONSTRAINT "ungatekeep_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ungatekeep_comments" ADD CONSTRAINT "ungatekeep_comments_post_id_ungatekeep_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."ungatekeep_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ungatekeep_post_votes" ADD CONSTRAINT "ungatekeep_post_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ungatekeep_post_votes" ADD CONSTRAINT "ungatekeep_post_votes_post_id_ungatekeep_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."ungatekeep_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ungatekeep_post_votes_user_post_unique" ON "ungatekeep_post_votes" USING btree ("user_id","post_id");--> statement-breakpoint
ALTER TABLE "ungatekeep_posts" ADD CONSTRAINT "ungatekeep_posts_toolkit_id_toolkits_id_fk" FOREIGN KEY ("toolkit_id") REFERENCES "public"."toolkits"("id") ON DELETE set null ON UPDATE no action;