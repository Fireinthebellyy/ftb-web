DO $$
BEGIN
  ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'editor';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
