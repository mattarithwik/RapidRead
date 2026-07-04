import { NextResponse } from "next/server";
import { buildLogoutUrl } from "@/lib/auth/cognito";
import { isCognitoEnabled } from "@/lib/auth/config";
import { clearAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  if (isCognitoEnabled()) {
    const response = NextResponse.json({ logoutUrl: buildLogoutUrl() });
    return clearAuthCookies(response);
  }
  const response = NextResponse.json({ ok: true });
  return clearAuthCookies(response);
}

export async function GET(request: Request) {
  if (isCognitoEnabled()) {
    const response = NextResponse.redirect(buildLogoutUrl());
    return clearAuthCookies(response);
  }
  const response = NextResponse.redirect(new URL("/", request.url));
  return clearAuthCookies(response);
}
