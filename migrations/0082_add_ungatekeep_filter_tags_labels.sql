-- Migration 0082: Add ungatekeep_filter_tags_labels column to site_settings table

-- Add the column to site_settings table
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "ungatekeep_filter_tags_labels" jsonb DEFAULT '{}'::jsonb;
