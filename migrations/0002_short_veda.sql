-- WARNING: This will delete all data in these columns
ALTER TABLE opportunities DROP COLUMN images;
ALTER TABLE opportunities DROP COLUMN tags;
ALTER TABLE opportunities DROP COLUMN type;

-- Then add them back with correct types
ALTER TABLE opportunities ADD COLUMN images text[] DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN tags text[] DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN type opportunity_type NOT NULL DEFAULT 'hackathon';
