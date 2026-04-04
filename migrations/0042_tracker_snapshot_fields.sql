ALTER TABLE "tracker_items"
ADD COLUMN IF NOT EXISTS "snapshot_title" text,
ADD COLUMN IF NOT EXISTS "snapshot_company" text,
ADD COLUMN IF NOT EXISTS "snapshot_logo" text;

-- Backfill snapshots for internships where source rows still exist
UPDATE "tracker_items" ti
SET
  "snapshot_title" = COALESCE(ti."snapshot_title", i."title"),
  "snapshot_company" = COALESCE(ti."snapshot_company", i."hiring_organization")
FROM "internships" i
WHERE ti."kind" = 'internship'
  AND ti."opp_id" = i."id"::text;

-- Backfill snapshots for opportunities where source rows still exist
UPDATE "tracker_items" ti
SET
  "snapshot_title" = COALESCE(ti."snapshot_title", o."title"),
  "snapshot_company" = COALESCE(ti."snapshot_company", o."organiser_info"),
  "snapshot_logo" = COALESCE(ti."snapshot_logo", o."images"[1])
FROM "opportunities" o
WHERE ti."kind" = 'opportunity'
  AND ti."opp_id" = o."id"::text;
