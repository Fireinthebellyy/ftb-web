import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  toolkitContentItems,
  userToolkits,
  cohortSessionContents,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import {
  generateBunnyEmbedUrl,
  extractBunnyVideoDetails,
  isBunnyVideo,
} from "@/lib/bunny";
import { getPaidCohortOrderForUser } from "@/lib/cohort-registration";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videoIdParam = req.nextUrl.searchParams.get("videoId");
    const cohortContentIdParam =
      req.nextUrl.searchParams.get("cohortContentId");
    const cohortIdParam = req.nextUrl.searchParams.get("cohortId");
    const videoUrlParam = req.nextUrl.searchParams.get("videoUrl");

    const isAdmin = session.user.role === "admin";

    // 1. Handle explicit Cohort Content Item
    if (cohortContentIdParam) {
      const contentItem = await db.query.cohortSessionContents.findFirst({
        where: eq(cohortSessionContents.id, cohortContentIdParam),
        with: {
          session: true,
        },
      });

      if (!contentItem) {
        return NextResponse.json(
          { error: "Cohort content item not found" },
          { status: 404 }
        );
      }

      if (!isAdmin) {
        const order = await getPaidCohortOrderForUser(
          session.user.id,
          contentItem.session.cohortId
        );
        if (!order) {
          return NextResponse.json(
            { error: "You do not have access to this cohort content" },
            { status: 403 }
          );
        }
      }

      const rawVideo =
        contentItem.cdnVideoUrl || contentItem.videoUrl || videoUrlParam;
      if (!rawVideo) {
        return NextResponse.json(
          { error: "No video URL available for this content" },
          { status: 404 }
        );
      }

      const details = extractBunnyVideoDetails(rawVideo);
      if (!details?.videoId) {
        return NextResponse.json(
          { error: "Invalid video identifier" },
          { status: 400 }
        );
      }

      const embedUrl = generateBunnyEmbedUrl(
        details.videoId,
        details.libraryId
      );
      return NextResponse.json({ videoUrl: embedUrl });
    }

    // 2. Handle generic videoId (checks toolkit content items first, then cohort content items)
    if (videoIdParam) {
      // Check Toolkit Content Items
      const toolkitItem = await db.query.toolkitContentItems.findFirst({
        where: eq(toolkitContentItems.id, videoIdParam),
      });

      if (toolkitItem) {
        if (!isAdmin) {
          const userHasAccess = await db.query.userToolkits.findFirst({
            where: and(
              eq(userToolkits.userId, session.user.id),
              eq(userToolkits.toolkitId, toolkitItem.toolkitId),
              eq(userToolkits.paymentStatus, "completed")
            ),
          });

          if (!userHasAccess) {
            return NextResponse.json(
              { error: "You do not have access to this content" },
              { status: 403 }
            );
          }
        }

        if (!toolkitItem.bunnyVideoUrl) {
          return NextResponse.json(
            { error: "No video URL available for this content" },
            { status: 404 }
          );
        }

        const details = extractBunnyVideoDetails(toolkitItem.bunnyVideoUrl);
        if (!details?.videoId) {
          return NextResponse.json(
            { error: "Invalid video URL format" },
            { status: 400 }
          );
        }

        const embedUrl = generateBunnyEmbedUrl(
          details.videoId,
          details.libraryId
        );
        return NextResponse.json({ videoUrl: embedUrl });
      }

      // Check Cohort Content Items if not found in toolkits
      const cohortItem = await db.query.cohortSessionContents.findFirst({
        where: eq(cohortSessionContents.id, videoIdParam),
        with: {
          session: true,
        },
      });

      if (cohortItem) {
        if (!isAdmin) {
          const order = await getPaidCohortOrderForUser(
            session.user.id,
            cohortItem.session.cohortId
          );
          if (!order) {
            return NextResponse.json(
              { error: "You do not have access to this cohort content" },
              { status: 403 }
            );
          }
        }

        const rawVideo =
          cohortItem.cdnVideoUrl || cohortItem.videoUrl || videoUrlParam;
        if (!rawVideo) {
          return NextResponse.json(
            { error: "No video URL available for this content" },
            { status: 404 }
          );
        }

        const details = extractBunnyVideoDetails(rawVideo);
        if (!details?.videoId) {
          return NextResponse.json(
            { error: "Invalid video identifier" },
            { status: 400 }
          );
        }

        const embedUrl = generateBunnyEmbedUrl(
          details.videoId,
          details.libraryId
        );
        return NextResponse.json({ videoUrl: embedUrl });
      }
    }

    // 3. Handle raw videoUrl/videoId with cohortId authorization
    if (videoUrlParam && isBunnyVideo(videoUrlParam)) {
      if (!isAdmin && cohortIdParam) {
        const order = await getPaidCohortOrderForUser(
          session.user.id,
          cohortIdParam
        );
        if (!order) {
          return NextResponse.json(
            { error: "You do not have access to this cohort" },
            { status: 403 }
          );
        }
      } else if (!isAdmin && !cohortIdParam) {
        return NextResponse.json(
          { error: "Access parameters missing" },
          { status: 400 }
        );
      }

      const details = extractBunnyVideoDetails(videoUrlParam);
      if (!details?.videoId) {
        return NextResponse.json(
          { error: "Invalid video identifier" },
          { status: 400 }
        );
      }

      const embedUrl = generateBunnyEmbedUrl(
        details.videoId,
        details.libraryId
      );
      return NextResponse.json({ videoUrl: embedUrl });
    }

    return NextResponse.json(
      { error: "Valid videoId, cohortContentId, or videoUrl required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating video access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
