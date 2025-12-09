import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    personaEnum,
    userOnboardingProfiles,
} from "@/lib/schema";
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

        const [profile] = await db
            .select()
            .from(userOnboardingProfiles)
            .where(eq(userOnboardingProfiles.userId, session.user.id));

        return new Response(JSON.stringify({ profile: profile ?? null }), {
            status: 200,
            headers: jsonHeaders,
        });
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
            persona?: (typeof personaEnum.enumValues)[number];
            locationType?: "city" | "state";
            locationValue?: string;
            educationLevel?: string;
            fieldOfStudy?: string;
            fieldOther?: string;
            opportunityInterests?: string[];
            domainPreferences?: string[];
            struggles?: string[];
        };

        if (!body.persona || !["student", "society"].includes(body.persona)) {
            return new Response(JSON.stringify({ error: "Invalid persona" }), {
                status: 400,
                headers: jsonHeaders,
            });
        }

        const isStudent = body.persona === "student";

        const locationType =
            body.locationType && ["city", "state"].includes(body.locationType)
                ? body.locationType
                : null;
        const locationValue =
            isStudent && body.locationValue && body.locationValue.trim().length > 1
                ? body.locationValue.trim()
                : null;

        const arraysAreStrings = (arr?: unknown) =>
            Array.isArray(arr) && arr.every((v) => typeof v === "string");

        const opportunityInterests =
            isStudent && arraysAreStrings(body.opportunityInterests)
                ? (body.opportunityInterests as string[])
                : [];
        const domainPreferences =
            isStudent && arraysAreStrings(body.domainPreferences)
                ? (body.domainPreferences as string[])
                : [];
        const struggles =
            isStudent && arraysAreStrings(body.struggles)
                ? (body.struggles as string[])
                : [];

        const payload = {
            persona: body.persona,
            locationType,
            locationValue,
            educationLevel: isStudent ? body.educationLevel ?? null : null,
            fieldOfStudy: isStudent ? body.fieldOfStudy ?? null : null,
            fieldOther:
                isStudent && body.fieldOfStudy === "Other"
                    ? body.fieldOther ?? null
                    : null,
            opportunityInterests,
            domainPreferences,
            struggles,
            updatedAt: new Date(),
        };

        const [profile] = await db
            .insert(userOnboardingProfiles)
            .values({
                userId: session.user.id,
                ...payload,
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: userOnboardingProfiles.userId,
                set: payload,
            })
            .returning({
                id: userOnboardingProfiles.id,
                persona: userOnboardingProfiles.persona,
                locationType: userOnboardingProfiles.locationType,
                locationValue: userOnboardingProfiles.locationValue,
                educationLevel: userOnboardingProfiles.educationLevel,
                fieldOfStudy: userOnboardingProfiles.fieldOfStudy,
                fieldOther: userOnboardingProfiles.fieldOther,
                opportunityInterests: userOnboardingProfiles.opportunityInterests,
                domainPreferences: userOnboardingProfiles.domainPreferences,
                struggles: userOnboardingProfiles.struggles,
                createdAt: userOnboardingProfiles.createdAt,
                updatedAt: userOnboardingProfiles.updatedAt,
            });

        return new Response(JSON.stringify({ profile }), {
            status: 200,
            headers: jsonHeaders,
        });
    } catch (error) {
        const err = error as Error;
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: jsonHeaders,
        });
    }
}

