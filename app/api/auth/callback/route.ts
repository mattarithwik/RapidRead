import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/lib/auth/cognito";
import { isCognitoEnabled } from "@/lib/auth/config";
import { ensureUserProfile, setAuthCookies } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/cognito";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCognitoEnabled()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get("oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }

  const tokens = await exchangeCodeForTokens(code);
  const idUser = await verifyIdToken(tokens.id_token);
  await ensureUserProfile(idUser.userId);

  const csrfToken = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("oauth_state");
  return setAuthCookies(response, tokens, csrfToken);
}
