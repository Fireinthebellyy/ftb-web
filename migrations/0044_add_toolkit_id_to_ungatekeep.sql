ALTER TABLE "ungatekeep_posts" ADD COLUMN "toolkit_id" uuid;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ungatekeep_posts_toolkit_id_toolkits_id_fk') THEN
        ALTER TABLE "ungatekeep_posts" 
        ADD CONSTRAINT "ungatekeep_posts_toolkit_id_toolkits_id_fk" 
        FOREIGN KEY ("toolkit_id") 
        REFERENCES "toolkits"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;