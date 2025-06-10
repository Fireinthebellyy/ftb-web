ALTER TABLE "users" ADD COLUMN "auth_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at_millis" bigint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primary_email_verified" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_id_users_sync_id_fk" FOREIGN KEY ("auth_id") REFERENCES "public"."users_sync"("id") ON DELETE no action ON UPDATE no action;