-- Migration: Update ungatekeep_posts table schema
-- Date: 2025-03-11
-- Description: 
--   1. Removes the title column
--   2. Removes the images column
--   3. Adds the attachments column

-- Drop the title column from ungatekeep_posts table
ALTER TABLE ungatekeep_posts DROP COLUMN IF EXISTS title;

-- Drop the images column from ungatekeep_posts table
ALTER TABLE ungatekeep_posts DROP COLUMN IF EXISTS images;

-- Add the attachments column to ungatekeep_posts table
ALTER TABLE ungatekeep_posts ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT ARRAY[]::text[];
