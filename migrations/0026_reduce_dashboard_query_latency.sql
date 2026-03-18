CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_active_feed_created_at_idx ON opportunities (created_at DESC) WHERE deleted_at IS NULL AND is_active = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_admin_feed_created_at_idx ON opportunities (created_at DESC) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_feed_type_created_at_idx ON opportunities (type, created_at DESC) WHERE deleted_at IS NULL AND is_active = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_end_date_idx ON opportunities (end_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_tag_ids_gin_idx ON opportunities USING GIN (tag_ids);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_title_trgm_idx ON opportunities USING GIN (title gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS opportunities_description_trgm_idx ON opportunities USING GIN (description gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tasks_user_completed_created_at_idx ON tasks (user_id, completed, created_at DESC);
