-- Migration 0081: Add ungatekeep_filter_tags_order column to site_settings table

-- Add the column to site_settings table
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "ungatekeep_filter_tags_order" text[] DEFAULT ARRAY[]::text[];
