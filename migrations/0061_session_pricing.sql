-- Add offer price and original (strikethrough) price to individual sessions
ALTER TABLE cohort_sessions
  ADD COLUMN IF NOT EXISTS price INTEGER,
  ADD COLUMN IF NOT EXISTS original_price INTEGER;
