import { db2 } from "@/lib/db2";
import { opportunities } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const opportunitySchema = z.object({
  type: z.array(
    z.enum(["hackathon", "grant application", "competition", "ideathon"])
  ),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().url("Invalid URL"),
  image: z.string().optional(),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const validatedData = opportunitySchema.parse(body);

    const insertData: any = {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      url: validatedData.url,
      userId: user.currentUser.id,
      isFlagged: false,
      isVerified: false,
      isActive: true,
    };

    if (validatedData.image) insertData.image = validatedData.image;
    if (validatedData.tags) insertData.tags = validatedData.tags;
    if (validatedData.location) insertData.location = validatedData.location;
    if (validatedData.organiserInfo)
      insertData.organiserInfo = validatedData.organiserInfo;
    if (validatedData.startDate)
      insertData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate)
      insertData.endDate = new Date(validatedData.endDate);

    const newOpportunity = await db2.insert(opportunities).values(insertData);

    return NextResponse.json(
      { success: true, data: newOpportunity },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Log the full error object for better debugging
    console.error("Full error object:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error creating opportunity:", errorMessage);

    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const allOpportunities = await db2.select().from(opportunities);

    return NextResponse.json(
      { success: true, opportunities: allOpportunities },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
