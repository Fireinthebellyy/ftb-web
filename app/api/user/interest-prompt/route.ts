import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import {
  INTEREST_AREA_IDS,
  normalizeInterestAreas,
  type InterestAreaId,
} from "@/lib/interest-prompt";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const jsonHeaders = { "Content-Type": "application/json" };

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const [row] = await db
      .select({
        interestPromptCompletedAt: userTable.interestPromptCompletedAt,
        interestAreas: userTable.interestAreas,
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id));

    const needsPrompt = !row?.interestPromptCompletedAt;
    const areas = normalizeInterestAreas(row?.interestAreas ?? []);

    return new Response(
      JSON.stringify({
        needsPrompt,
        areas,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const body = (await request.json().catch(() => ({}))) as {
      areas?: unknown;
    };

    const areas = normalizeInterestAreas(body.areas);
    if (areas.length === 0) {
      return new Response(
        JSON.stringify({ error: "Select at least one interest" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const invalid = areas.filter(
      (a) => !(INTEREST_AREA_IDS as readonly string[]).includes(a)
    );
    if (invalid.length > 0) {
      return new Response(JSON.stringify({ error: "Invalid interest id" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const now = new Date();
    await db
      .update(userTable)
      .set({
        interestPromptCompletedAt: now,
        interestAreas: areas as InterestAreaId[],
        updatedAt: now,
      })
      .where(eq(userTable.id, session.user.id));

    return new Response(
      JSON.stringify({
        needsPrompt: false,
        areas,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
