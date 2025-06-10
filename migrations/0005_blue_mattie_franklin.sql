ALTER TABLE "mentors" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "mentors" ALTER COLUMN "tags" SET DEFAULT '{}';