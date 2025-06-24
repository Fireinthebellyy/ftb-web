CREATE TYPE "public"."opportunity_type" AS ENUM('hackathon', 'grant application', 'competition', 'ideathon');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text,
	"opportunity_id" text
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "opportunity_type"[] DEFAULT '{}',
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"image" text,
	"tags" text[] DEFAULT '{}',
	"location" text,
	"organiser_info" text,
	"start_date" date,
	"end_date" date,
	"comments" text[] DEFAULT '{}',
	"is_flagged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by_user" text
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_neon_auth.users_sync_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_user_neon_auth.users_sync_id_fk" FOREIGN KEY ("created_by_user") REFERENCES "public"."neon_auth.users_sync"("id") ON DELETE no action ON UPDATE no action;