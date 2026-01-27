ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."opportunity_type";--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('hackathon', 'grant', 'competition', 'ideathon');--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE "public"."opportunity_type" USING "type"::"public"."opportunity_type";