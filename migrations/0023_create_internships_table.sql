-- Migration: Create internships table
-- This migration creates the complete internships table with all columns and constraints

-- Step 1: Create internship_type enum type (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE internship_type AS ENUM ('in-office', 'work-from-home', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create internship_timing enum type (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE internship_timing AS ENUM ('full-time', 'part-time', 'shift-based');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create internships table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type internship_type NOT NULL,
  timing internship_timing NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  poster TEXT NOT NULL,
  tag_ids UUID[] DEFAULT '{}',
  location TEXT,
  deadline DATE,
  stipend INTEGER,
  hiring_organization TEXT NOT NULL,
  hiring_manager TEXT,
  hiring_manager_email TEXT,
  experience TEXT,
  eligibility TEXT[] DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_internships_user_id ON internships(user_id);
CREATE INDEX IF NOT EXISTS idx_internships_type ON internships(type);
CREATE INDEX IF NOT EXISTS idx_internships_timing ON internships(timing);
CREATE INDEX IF NOT EXISTS idx_internships_is_active ON internships(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_deleted_at ON internships(deleted_at);
CREATE INDEX IF NOT EXISTS idx_internships_created_at ON internships(created_at DESC);

