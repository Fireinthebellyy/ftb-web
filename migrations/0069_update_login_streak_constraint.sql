ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "login_streak_range";
ALTER TABLE "user" ADD CONSTRAINT "login_streak_range" CHECK ("login_streak" >= 0);
