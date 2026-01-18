import { NextResponse } from "next/server";

export async function GET() {
    try {
        const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
        const commitRef = process.env.VERCEL_GIT_COMMIT_REF;
        const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE;

        // Return commit info if available (only on Vercel)
        if (commitSha) {
            return NextResponse.json({
                commitSha: commitSha.substring(0, 7), // Short SHA (first 7 chars)
                commitRef: commitRef || null,
                commitMessage: commitMessage || null,
            });
        }

        // Fallback for local development
        return NextResponse.json({
            commitSha: null,
            commitRef: null,
            commitMessage: null,
        });
    } catch (error) {
        return NextResponse.json(
            { error: `Failed to fetch version info: ${error}` },
            { status: 500 }
        );
    }
}
