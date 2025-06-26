CREATE TABLE "users_sync" (
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
--> statement-breakpoint
ALTER TABLE "neon_auth.users_sync" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "neon_auth.users_sync" CASCADE;--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_neon_auth.users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_created_by_user_neon_auth.users_sync_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mentors" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "mentors" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_sync_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_sync"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_user_users_sync_id_fk" FOREIGN KEY ("created_by_user") REFERENCES "public"."users_sync"("id") ON DELETE no action ON UPDATE no action;