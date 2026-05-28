import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toolkits } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allToolkits = await db.select({
      id: toolkits.id,
      title: toolkits.title,
      category: toolkits.category,
      mentorshipDetails: toolkits.mentorshipDetails
    }).from(toolkits).where(eq(toolkits.category, "1:1 Mentorship"));
    
    return NextResponse.json({ 
      count: allToolkits.length,
      toolkits: allToolkits
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
