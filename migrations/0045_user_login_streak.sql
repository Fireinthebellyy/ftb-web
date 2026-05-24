ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "login_streak" integer NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_date" date;
