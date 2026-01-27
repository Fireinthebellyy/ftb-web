CREATE TYPE "public"."internship_type" AS ENUM('part-time', 'full-time', 'contract', 'remote');--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "internship_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" text,
	"poster" text,
	"tag_ids" uuid[] DEFAULT '{}',
	"location" text,
	"deadline" date,
	"stipend" integer,
	"hiring_organization" text NOT NULL,
	"hiring_manager" text,
	"is_flagged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"application_count" integer DEFAULT 0,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opportunities" RENAME COLUMN "tags" TO "tag_ids";--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;