-- Migration: Add internship search terms table
-- Date: 2026-03-20
-- Description:
--   Tracks internship search terms for global trending searches.

CREATE TABLE IF NOT EXISTS "internship_search_terms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "term" text NOT NULL,
  "normalized_term" text NOT NULL,
  "search_count" integer NOT NULL DEFAULT 1,
  "last_searched_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "internship_search_terms_normalized_term_unique"
  ON "internship_search_terms" ("normalized_term");

CREATE INDEX IF NOT EXISTS "internship_search_terms_count_idx"
  ON "internship_search_terms" ("search_count");

CREATE INDEX IF NOT EXISTS "internship_search_terms_last_idx"
  ON "internship_search_terms" ("last_searched_at");
