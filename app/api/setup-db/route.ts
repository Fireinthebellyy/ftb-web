import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "toolkit_community_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "toolkit_id" uuid NOT NULL,
        "type" text DEFAULT 'text' NOT NULL,
        "title" text NOT NULL,
        "body" text,
        "options" jsonb DEFAULT '[]'::jsonb,
        "attachment_url" text,
        "attachment_name" text,
        "attachment_type" text,
        "order_index" integer DEFAULT 0 NOT NULL,
        "is_published" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "toolkit_community_responses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "post_id" uuid NOT NULL,
        "user_id" text NOT NULL,
        "selected_option_index" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "toolkit_community_responses_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "toolkit_community_posts"("id") ON DELETE cascade ON UPDATE no action,
        CONSTRAINT "toolkit_community_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "toolkit_community_responses_post_user_unique" ON "toolkit_community_responses" ("post_id", "user_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "toolkit_community_responses_post_id_idx" ON "toolkit_community_responses" ("post_id");
    `);

    return NextResponse.json({
      success: true,
      message: "Toolkit community tables are ready",
    });
  } catch (error: unknown) {
    console.error("Setup DB error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to set up tables";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
