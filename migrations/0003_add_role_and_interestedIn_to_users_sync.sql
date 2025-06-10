-- Migration: Add role and instrestedIn columns to users_sync table in neon_auth schema

ALTER TABLE neon_auth.users_sync
ADD COLUMN role text DEFAULT 'student',
ADD COLUMN instrestedIn text[] DEFAULT '{}';