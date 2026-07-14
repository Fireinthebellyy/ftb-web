-- Add has_early_bird toggle to cohorts
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS has_early_bird BOOLEAN DEFAULT FALSE;
