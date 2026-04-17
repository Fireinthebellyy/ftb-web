import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const guardedUrl = new URL(request.url);
    const authMode = guardedUrl.searchParams.get("auth");

    if (authMode !== "login" && authMode !== "signup") {
      guardedUrl.searchParams.set("auth", "login");
      return NextResponse.redirect(guardedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/opportunities/:path*",
    "/featured",
    "/toolkit/:path*",
    "/intern/:path*",
    "/internships/:path*",
    "/tracker/:path*",
  ],
};
