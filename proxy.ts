import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Strip `auth` overlay param and build a safe return path for /login?returnUrl=...
 */
function buildReturnPathFromRequest(url: URL): string {
  const params = new URLSearchParams(url.searchParams);
  params.delete("auth");
  const query = params.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export async function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const returnPath = buildReturnPathFromRequest(url);

  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", returnPath);
  return NextResponse.redirect(loginUrl);
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
