import { NextRequest } from "next/server";
import ogs from "open-graph-scraper";

// Extract first URL from a text block (handles (), [] and trailing punctuation)
function extractFirstUrl(text: string): string | null {
  // Match http/https URLs
  const urlRegex = /https?:\/\/[^\s<>"'`|\\^{}\[\]]+/gi;

  const match = text.match(urlRegex);
  if (!match) return null;

  // Clean trailing punctuation or unmatched parentheses/brackets
  let url = match[0].trim();

  // Remove trailing punctuation
  url = url.replace(/[),.;:!?]+$/g, "");

  // Balance parentheses if needed
  const openCount = (url.match(/\(/g) || []).length;
  const closeCount = (url.match(/\)/g) || []).length;
  if (closeCount > openCount) {
    // remove extra closing )
    url = url.replace(/\)+$/g, "");
  }

  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const description: unknown = (body as any)?.description;

    if (typeof description !== "string") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "INVALID_BODY",
          message: "Expected body: { description: string }",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if description contains a URL; only then call OG scraper
    const url = extractFirstUrl(description);
    if (!url) {
      return new Response(
        JSON.stringify({ ok: false, error: "NO_URL_IN_DESCRIPTION" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { result, error } = await ogs({ url });

    if (error) {
      // result likely contains error details
      return new Response(
        JSON.stringify({
          ok: false,
          error: "OG_SCRAPE_FAILED",
          details: result,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize a minimal payload focused on meta description
    const payload = {
      ok: true,
      url,
      meta: {
        title: (result as any).ogTitle ?? null,
        description:
          (result as any).ogDescription ?? (result as any).description ?? null,
        image: Array.isArray((result as any).ogImage)
          ? (result as any).ogImage?.[0]?.url ?? null
          : (result as any).ogImage?.url ?? null,
        siteName: (result as any).ogSiteName ?? null,
        type: (result as any).ogType ?? null,
      },
      rawResult: result,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "INTERNAL_ERROR",
        message: err?.message ?? "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
