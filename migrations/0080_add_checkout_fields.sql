-- Migration: Add checkout customization fields to cold_dm_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_dm_templates' 
    AND column_name = 'checkout_title'
  ) THEN
    ALTER TABLE cold_dm_templates 
    ADD COLUMN checkout_title TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_dm_templates' 
    AND column_name = 'checkout_description'
  ) THEN
    ALTER TABLE cold_dm_templates 
    ADD COLUMN checkout_description TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cold_dm_templates' 
    AND column_name = 'benefits'
  ) THEN
    ALTER TABLE cold_dm_templates 
    ADD COLUMN benefits TEXT;
  END IF;
END $$;
