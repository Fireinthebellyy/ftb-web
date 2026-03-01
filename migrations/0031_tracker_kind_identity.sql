-- Up
DROP INDEX IF EXISTS "tracker_items_user_opp_unique";
CREATE UNIQUE INDEX "tracker_items_user_kind_opp_unique"
  ON "tracker_items" USING btree ("user_id", "kind", "opp_id");

-- Down (manual rollback)
-- DROP INDEX IF EXISTS "tracker_items_user_kind_opp_unique";
-- CREATE UNIQUE INDEX "tracker_items_user_opp_unique"
--   ON "tracker_items" USING btree ("user_id", "opp_id");
