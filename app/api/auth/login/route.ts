import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/auth/cognito";
import { AUTH_COOKIE_CSRF, isCognitoEnabled } from "@/lib/auth/config";
import { DEV_USER_COOKIE, cookieOptions } from "@/lib/auth/session";
import { createUserId } from "@/lib/user";

export const runtime = "nodejs";

export async function GET() {
  if (!isCognitoEnabled()) {
    const userId = createUserId();
    const csrfToken = randomBytes(16).toString("hex");
    const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
    response.cookies.set(DEV_USER_COOKIE, userId, cookieOptions(60 * 60 * 24 * 30));
    response.cookies.set(AUTH_COOKIE_CSRF, csrfToken, {
      ...cookieOptions(60 * 60 * 24 * 30),
      httpOnly: false
    });
    return response;
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set("oauth_state", state, cookieOptions(600));
  return response;
}
