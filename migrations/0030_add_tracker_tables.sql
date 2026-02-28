-- Up
CREATE TABLE "tracker_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "opp_id" text NOT NULL,
  "kind" text DEFAULT 'internship',
  "status" text NOT NULL,
  "notes" text,
  "added_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "applied_at" timestamp,
  "result" text,
  "is_manual" boolean DEFAULT false,
  "manual_data" text
);
--> statement-breakpoint
CREATE TABLE "tracker_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "date" timestamp NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tracker_items" ADD CONSTRAINT "tracker_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tracker_events" ADD CONSTRAINT "tracker_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "tracker_items_user_opp_unique" ON "tracker_items" USING btree ("user_id", "opp_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tracker_events_user_title_date_unique" ON "tracker_events" USING btree ("user_id", "title", "date");

-- Down (manual rollback)
-- DROP INDEX IF EXISTS "tracker_events_user_title_date_unique";
-- DROP INDEX IF EXISTS "tracker_items_user_opp_unique";
-- ALTER TABLE "tracker_events" DROP CONSTRAINT IF EXISTS "tracker_events_user_id_user_id_fk";
-- ALTER TABLE "tracker_items" DROP CONSTRAINT IF EXISTS "tracker_items_user_id_user_id_fk";
-- DROP TABLE IF EXISTS "tracker_events";
-- DROP TABLE IF EXISTS "tracker_items";
