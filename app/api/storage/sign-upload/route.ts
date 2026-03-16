import { getSessionCached } from "@/lib/auth-session-cache";
import { getSignedUploadUrl } from "@/lib/storage";
import { StorageDomain } from "@/lib/storage/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const signUploadSchema = z.object({
  domain: z.enum([
    "opportunity-images",
    "ungatekeep-images",
    "avatar-images",
    "opportunity-attachments",
  ]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(200),
  fileSize: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = signUploadSchema.parse(body);

    const signed = await getSignedUploadUrl({
      domain: parsed.domain as StorageDomain,
      userId: session.user.id,
      fileName: parsed.fileName,
      contentType: parsed.contentType,
      fileSize: parsed.fileSize,
    });

    return NextResponse.json(signed, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to sign upload URL";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
