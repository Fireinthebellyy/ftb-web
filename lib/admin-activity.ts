import { db } from "@/lib/db";
import { adminActivityLogs } from "@/lib/schema";

type JsonObject = Record<string, unknown>;

interface LogAdminActivityInput {
  request: Request;
  action: string;
  statusCode: number;
  success: boolean;
  adminUserId?: string | null;
  entityType?: string;
  entityId?: string | null;
  metadata?: JsonObject;
  beforeState?: unknown;
  afterState?: unknown;
  error?: unknown;
}

function normalizeIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip");
}

function normalizeError(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function normalizeJson(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_, v) => {
        if (v instanceof Date) {
          return v.toISOString();
        }

        if (typeof v === "bigint") {
          return v.toString();
        }

        if (v instanceof Error) {
          return {
            name: v.name,
            message: v.message,
          };
        }

        return v;
      })
    );
  } catch {
    return null;
  }
}

export async function logAdminActivity({
  request,
  action,
  statusCode,
  success,
  adminUserId,
  entityType,
  entityId,
  metadata,
  beforeState,
  afterState,
  error,
}: LogAdminActivityInput): Promise<void> {
  if (!db) {
    return;
  }

  try {
    await db.insert(adminActivityLogs).values({
      adminUserId: adminUserId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode,
      success,
      ipAddress: normalizeIpAddress(request),
      userAgent: request.headers.get("user-agent"),
      requestId:
        request.headers.get("x-request-id") ??
        request.headers.get("x-vercel-id") ??
        crypto.randomUUID(),
      metadata: (normalizeJson(metadata) as JsonObject | null) ?? null,
      beforeState: normalizeJson(beforeState),
      afterState: normalizeJson(afterState),
      error: normalizeError(error),
    });
  } catch (loggingError) {
    console.error("Failed to write admin activity log:", loggingError);
  }
}
