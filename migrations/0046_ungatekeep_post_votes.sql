CREATE TABLE IF NOT EXISTS "ungatekeep_post_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "post_id" uuid NOT NULL,
  "vote" integer NOT NULL,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "ungatekeep_post_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ungatekeep_post_votes_post_id_ungatekeep_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."ungatekeep_posts"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ungatekeep_post_votes_vote_check" CHECK ("vote" IN (1, -1))
);

CREATE UNIQUE INDEX IF NOT EXISTS "ungatekeep_post_votes_user_post_unique" ON "ungatekeep_post_votes" ("user_id", "post_id");
