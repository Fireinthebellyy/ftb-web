import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toolkitContentItems, userToolkits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { generateBunnyEmbedUrl } from "@/lib/bunny";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videoId = req.nextUrl.searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const contentItem = await db.query.toolkitContentItems.findFirst({
      where: eq(toolkitContentItems.id, videoId),
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
      );
    }

    const userHasAccess = await db.query.userToolkits.findFirst({
      where: and(
        eq(userToolkits.userId, session.user.id),
        eq(userToolkits.toolkitId, contentItem.toolkitId),
        eq(userToolkits.paymentStatus, "completed")
      ),
    });

    if (!userHasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this content" },
        { status: 403 }
      );
    }

    if (!contentItem.bunnyVideoUrl) {
      return NextResponse.json(
        { error: "No video URL available for this content" },
        { status: 404 }
      );
    }

    // Extract video ID from URL (handles both /videoId and full URL formats)
    let bunnyVideoId = contentItem.bunnyVideoUrl;

    // Handle full URLs by extracting just the video ID (UUID) without query parameters
    if (bunnyVideoId.includes("/")) {
      // Extract the last path segment before any query parameters
      const pathPart = bunnyVideoId.split("?")[0]; // Remove query string first
      bunnyVideoId = pathPart.split("/").pop() || "";
    } else {
      // If it's already just an ID, remove any query parameters
      bunnyVideoId = bunnyVideoId.split("?")[0];
    }

    if (!bunnyVideoId) {
      return NextResponse.json(
        { error: "Invalid video URL format" },
        { status: 500 }
      );
    }

    const embedUrl = generateBunnyEmbedUrl(bunnyVideoId);

    return NextResponse.json({ videoUrl: embedUrl });
  } catch (error) {
    console.error("Error generating video access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
