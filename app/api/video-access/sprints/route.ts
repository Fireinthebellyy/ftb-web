import { NextRequest, NextResponse } from "next/server";
import { isBunnyVideo, extractBunnyVideoDetails, generateBunnyEmbedUrl } from "@/lib/bunny";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sprints } from "@/lib/schema";

function resolveVideoResponse(rawVideo: string): NextResponse {
    if (isBunnyVideo(rawVideo)) {
        const details = extractBunnyVideoDetails(rawVideo);
        if (!details?.videoId) {
            return NextResponse.json(
                { error: "Invalid video identifier" },
                { status: 400 }
            );
        }

        const embedUrl = generateBunnyEmbedUrl(details.videoId, details.libraryId);
        return NextResponse.json({ videoUrl: embedUrl });
    }

    if (rawVideo.startsWith("http://") || rawVideo.startsWith("https://")) {
        return NextResponse.json({ videoUrl: rawVideo });
    }

    return NextResponse.json(
        { error: "Invalid video identifier" },
        { status: 400 }
    );
}

export async function GET(req: NextRequest) {
    try {
        const videoUrlParam = req.nextUrl.searchParams.get("videoUrl");
        const sprintIdParam = req.nextUrl.searchParams.get("sprintId");

        if (sprintIdParam) {
            const sprint = await db.query.sprints.findFirst({
                where: eq(sprints.id, sprintIdParam)
            })

            if (!sprint) {
                return NextResponse.json(
                    { error: "Sprint not found" },
                    { status: 404 }
                );
            }

            const rawVideo = (videoUrlParam ===sprint.videoUrl? videoUrlParam : sprint.videoUrl) || null;
            if (!rawVideo) {
                return NextResponse.json(
                    { error: "No video id available for this sprint" },
                    { status: 404 }
                );
            }

            return resolveVideoResponse(rawVideo);
        }

        return NextResponse.json(
            { error: "Valid sprintId or videoUrl required" },
            { status: 400 }
        );
    }
    catch (err) {
        console.error("Error generating video access:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}