-- Add Cold DM settings columns to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS cold_dm_show_page_banner BOOLEAN DEFAULT true;

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS cold_dm_show_templates BOOLEAN DEFAULT true;
