ALTER TABLE "ungatekeep_post_votes" ALTER COLUMN "vote" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "hiring_manager_linkedin" text;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "hiring_manager_email" text;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "field" text;--> statement-breakpoint
ALTER TABLE "ungatekeep_post_votes" ADD CONSTRAINT "vote_check" CHECK ("ungatekeep_post_votes"."vote" IN (-1, 0, 1));--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "login_streak_range" CHECK ("user"."login_streak" BETWEEN 0 AND 30);