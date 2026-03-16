import { getSessionCached } from "@/lib/auth-session-cache";
import { deleteStorageObject } from "@/lib/storage";
import { StorageDomain } from "@/lib/storage/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteObjectSchema = z.object({
  domain: z.enum([
    "opportunity-images",
    "ungatekeep-images",
    "avatar-images",
    "opportunity-attachments",
  ]),
  key: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const session = await getSessionCached(await headers());

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteObjectSchema.parse(body);

    const isAdmin = session.user.role === "admin";
    const isOwner = parsed.key.startsWith(`${session.user.id}/`);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteStorageObject(parsed.domain as StorageDomain, parsed.key);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete file";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
