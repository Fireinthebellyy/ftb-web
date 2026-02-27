ALTER TABLE "tracker_items"
ADD COLUMN "calendar_event_id" text,
ADD COLUMN "calendar_event_synced_at" timestamp;
