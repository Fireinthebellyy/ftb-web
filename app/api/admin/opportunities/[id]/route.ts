import { db } from "@/lib/db";
import { opportunities } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateOpportunitySchema = z.object({
    action: z.enum(["approve", "reject"]),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!db) {
            return NextResponse.json(
                { error: "Database connection not available" },
                { status: 500 }
            );
        }

        // Check if user is admin
        const currentUser = await getCurrentUser();
        if (currentUser?.currentUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const opportunityId = params.id;
        if (!opportunityId) {
            return NextResponse.json(
                { error: "Opportunity ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const validatedData = updateOpportunitySchema.parse(body);

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (validatedData.action === "approve") {
            updateData.isActive = true;
            updateData.isVerified = true;
        } else if (validatedData.action === "reject") {
            updateData.isActive = false;
            // Optionally set deletedAt for rejected opportunities
            // updateData.deletedAt = new Date();
        }

        const updatedOpportunity = await db
            .update(opportunities)
            .set(updateData)
            .where(eq(opportunities.id, opportunityId))
            .returning();

        if (updatedOpportunity.length === 0) {
            return NextResponse.json(
                { error: "Opportunity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: `Opportunity ${validatedData.action}d successfully`,
                opportunity: updatedOpportunity[0],
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }

        console.error("Error updating opportunity:", error);
        return NextResponse.json(
            { error: "Failed to update opportunity" },
            { status: 500 }
        );
    }
}
