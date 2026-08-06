import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Adding columns to site_settings...");
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "buddy_offer_title" text DEFAULT 'Friendship Day Offer';`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "buddy_offer_text" text DEFAULT 'Learning is better together! Enter your friend''s email below so they can get access that too at 20% off';`);
    console.log("Columns added successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
