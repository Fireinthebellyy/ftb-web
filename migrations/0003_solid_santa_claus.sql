CREATE TABLE "mentors" (
	"id" text PRIMARY KEY NOT NULL,
	"mentor_name" text NOT NULL,
	"mentor_number" text,
	"mentor_image" text,
	"description" text,
	"mentor_email" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"tags" text,
	"cal_link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"rating" integer,
	"availability" boolean DEFAULT true
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
DROP TYPE "public"."user_role";