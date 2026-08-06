import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Applying session schema updates...");
    await db.execute(sql`ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_whatsapp_link" text;`);
    await db.execute(sql`ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_meet_link" text;`);
    await db.execute(sql`ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_date" timestamp;`);
    await db.execute(sql`ALTER TABLE "toolkits" ADD COLUMN IF NOT EXISTS "session_questions" jsonb DEFAULT '[]'::jsonb;`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session_applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "toolkit_id" uuid NOT NULL REFERENCES "toolkits"("id") ON DELETE CASCADE,
        "answers" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    console.log("Schema updates applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
