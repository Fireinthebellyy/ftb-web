export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  return handleMigration();
}

export async function POST() {
  return handleMigration();
}

async function handleMigration() {
  try {
    await db.execute(sql`
      ALTER TABLE toolkits 
      ADD COLUMN IF NOT EXISTS mentorship_details jsonb,
      ADD COLUMN IF NOT EXISTS summary text[],
      ADD COLUMN IF NOT EXISTS rating text,
      ADD COLUMN IF NOT EXISTS subtitle text;
    `);
    
    await db.execute(sql`
      ALTER TABLE toolkit_community_responses 
      ADD COLUMN IF NOT EXISTS text_response text,
      ADD COLUMN IF NOT EXISTS attachment_url text,
      ADD COLUMN IF NOT EXISTS attachment_name text,
      ADD COLUMN IF NOT EXISTS attachment_type text;
    `);
    
    await db.execute(sql`
      ALTER TABLE toolkit_community_responses 
      ALTER COLUMN selected_option_index DROP NOT NULL;
    `);
    
    await db.execute(sql`
      ALTER TABLE toolkit_community_posts 
      ADD COLUMN IF NOT EXISTS attachment_url text,
      ADD COLUMN IF NOT EXISTS attachment_name text,
      ADD COLUMN IF NOT EXISTS attachment_type text;
    `);
    
    return NextResponse.json({ success: true, message: "Migration completed successfully! (Generated at " + new Date().toISOString() + ")" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
