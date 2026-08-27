-- Add show_in_dashboard and show_in_home fields to cohort_sessions table
-- These fields control where sessions are displayed: in dashboard and/or on home page

ALTER TABLE "cohort_sessions" 
ADD COLUMN "show_in_dashboard" boolean DEFAULT true NOT NULL,
ADD COLUMN "show_in_home" boolean DEFAULT true NOT NULL;
