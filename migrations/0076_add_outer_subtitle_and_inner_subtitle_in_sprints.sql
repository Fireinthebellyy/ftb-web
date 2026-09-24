ALTER TABLE sprints
    ADD COLUMN IF NOT EXISTS outer_subtitle TEXT,
    ADD COLUMN IF NOT EXISTS inner_subtitle TEXT;

UPDATE sprints
SET inner_subtitle = subtitle
WHERE inner_subtitle IS NULL
  AND subtitle IS NOT NULL;