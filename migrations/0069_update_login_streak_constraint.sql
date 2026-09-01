ALTER TABLE "user" ADD CONSTRAINT "login_streak_range_tmp" CHECK ("login_streak" >= 0) NOT VALID;
ALTER TABLE "user" VALIDATE CONSTRAINT "login_streak_range_tmp";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "login_streak_range";
ALTER TABLE "user" RENAME CONSTRAINT "login_streak_range_tmp" TO "login_streak_range";
