-- Add priority column to opportunities table
-- Lower number = higher priority (1 shows on top). NULL = no priority.
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS priority integer;
