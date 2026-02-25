import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { banners } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

// GET all active banners
export async function GET() {
    try {
        const activeBanners = await db
            .select()
            .from(banners)
            .where(eq(banners.isActive, true))
            .orderBy(asc(banners.priority));

        return NextResponse.json(activeBanners);
    } catch (error) {
        console.error("Error fetching banners:", error);
        return NextResponse.json(
            { error: "Failed to fetch banners" },
            { status: 500 }
        );
    }
}
