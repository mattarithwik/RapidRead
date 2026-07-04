import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_ACCESS, AUTH_COOKIE_ID, DEV_USER_COOKIE, isCognitoEnabled } from "@/lib/auth/config";

const publicPaths = ["/sign-in", "/api/auth/login", "/api/auth/callback", "/api/auth/session"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const hasSession = isCognitoEnabled()
    ? Boolean(request.cookies.get(AUTH_COOKIE_ACCESS)?.value || request.cookies.get(AUTH_COOKIE_ID)?.value)
    : Boolean(request.cookies.get(DEV_USER_COOKIE)?.value);

  if (!hasSession && pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }

  if (!hasSession && !pathname.startsWith("/api/")) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"]
};
