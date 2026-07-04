import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_CSRF, DEV_USER_COOKIE, isCognitoEnabled } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  const jar = await cookies();
  let csrfToken = jar.get(AUTH_COOKIE_CSRF)?.value;
  if (session && !csrfToken) {
    csrfToken = randomBytes(16).toString("hex");
  }
  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user ?? null,
    csrfToken: session ? csrfToken : null,
    mode: isCognitoEnabled() ? "cognito" : "dev"
  });
}
