-- Migration 0079: Add Cold DM Templates tables

-- Create enum type for template types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cold_dm_template_type') THEN
    CREATE TYPE cold_dm_template_type AS ENUM ('pdf', 'image', 'document');
  END IF;
END $$;

-- Create cold_dm_templates table
CREATE TABLE IF NOT EXISTS cold_dm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type cold_dm_template_type NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_size integer, -- in bytes
  price integer NOT NULL, -- in rupees
  original_price integer, -- for displaying strikethrough discount price
  preview_image_url text, -- for template preview
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create user_cold_dm_templates table
CREATE TABLE IF NOT EXISTS user_cold_dm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  template_id uuid NOT NULL,
  purchase_date timestamp DEFAULT now(),
  razorpay_order_id text,
  payment_id text,
  payment_status text CHECK (payment_status IN ('pending', 'completed', 'failed')),
  amount_paid integer,
  created_at timestamp DEFAULT now()
);

-- Create unique constraint on user_id and template_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cold_dm_templates_user_template_unique'
  ) THEN
    ALTER TABLE user_cold_dm_templates
    ADD CONSTRAINT user_cold_dm_templates_user_template_unique
    UNIQUE (user_id, template_id);
  END IF;
END $$;

-- Create foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cold_dm_templates_user_id_fkey'
  ) THEN
    ALTER TABLE user_cold_dm_templates
    ADD CONSTRAINT user_cold_dm_templates_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_cold_dm_templates_template_id_fkey'
  ) THEN
    ALTER TABLE user_cold_dm_templates
    ADD CONSTRAINT user_cold_dm_templates_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES cold_dm_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cold_dm_templates_is_active ON cold_dm_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_cold_dm_templates_order_index ON cold_dm_templates(order_index);
CREATE INDEX IF NOT EXISTS idx_cold_dm_templates_type ON cold_dm_templates(type);
CREATE INDEX IF NOT EXISTS idx_cold_dm_templates_created_at ON cold_dm_templates(created_at);

CREATE INDEX IF NOT EXISTS idx_user_cold_dm_templates_user_id ON user_cold_dm_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cold_dm_templates_template_id ON user_cold_dm_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_user_cold_dm_templates_payment_status ON user_cold_dm_templates(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_cold_dm_templates_purchase_date ON user_cold_dm_templates(purchase_date);
