CREATE TYPE "public"."user_role" AS ENUM('student', 'mentor', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"bio" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"role" "user_role" NOT NULL,
	"bookmarks" text DEFAULT '[]',
	"email" varchar(255) NOT NULL,
	"interested_field" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
