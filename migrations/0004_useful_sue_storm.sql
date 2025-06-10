CREATE TYPE "public"."user_role" AS ENUM('student', 'mentor', 'admin');--> statement-breakpoint
CREATE TABLE "neon_auth.users_sync" (
	"raw_json" text,
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"bookmarks" text[],
	"role" "user_role" DEFAULT 'student',
	"instrestedIn" text[] DEFAULT '{}'
);
