-- Migration for toolkit content features
-- Generated manually due to enum conflicts

-- Create the enum type for content item types
CREATE TYPE toolkit_content_item_type AS ENUM ('article', 'video');

-- Add new columns to toolkits table
ALTER TABLE toolkits ADD COLUMN original_price INTEGER;
ALTER TABLE toolkits ADD COLUMN category TEXT;
ALTER TABLE toolkits ADD COLUMN highlights TEXT[];
ALTER TABLE toolkits ADD COLUMN total_duration TEXT;
ALTER TABLE toolkits ADD COLUMN lesson_count INTEGER DEFAULT 0;

-- Create toolkit_content_items table
CREATE TABLE toolkit_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toolkit_id UUID NOT NULL REFERENCES toolkits(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type toolkit_content_item_type NOT NULL,
    content TEXT,
    vimeo_video_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering content items
CREATE INDEX idx_toolkit_content_items_order ON toolkit_content_items(toolkit_id, order_index);

-- Create index for category filtering
CREATE INDEX idx_toolkits_category ON toolkits(category) WHERE category IS NOT NULL;
