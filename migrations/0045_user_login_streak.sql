ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "login_streak" integer NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_date" date;
ALTER TABLE "user" ADD CONSTRAINT "login_streak_range" CHECK ("login_streak" BETWEEN 0 AND 30);
