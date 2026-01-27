-- Replace tags text[] with tag_ids uuid[] (data in tags column will be lost)
ALTER TABLE opportunities DROP COLUMN IF EXISTS tags;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tag_ids uuid[] DEFAULT '{}';

