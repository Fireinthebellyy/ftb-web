-- Migration for updating cohort_session_resources type column
-- Created: 2026-07-13

-- Update the type column to allow new resource types
-- The column already exists as TEXT, so we just need to ensure it can accept the new values
-- No ALTER TABLE needed since TEXT type can accept any string value
-- This migration is for documentation purposes to track the change
