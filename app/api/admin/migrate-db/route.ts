import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check if the column exists first
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='toolkits' AND column_name='mentorship_details';
    `);

    if (result.rowCount === 0) {
      // Add the column
      await db.execute(sql`ALTER TABLE toolkits ADD COLUMN mentorship_details jsonb;`);
      return NextResponse.json({ message: "Column mentorship_details added successfully!" });
    } else {
      return NextResponse.json({ message: "Column mentorship_details already exists." });
    }
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
