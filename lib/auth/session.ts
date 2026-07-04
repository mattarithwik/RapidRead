import { cookies } from "next/headers";
import { profileFallback } from "@/lib/seed";
import { getProfile, upsertProfile } from "@/lib/storage/store";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_CSRF,
  AUTH_COOKIE_ID,
  AUTH_COOKIE_REFRESH,
  DEV_USER_COOKIE,
  isCognitoEnabled
} from "@/lib/auth/config";
import type { AuthUser } from "@/lib/auth/cognito";
import { verifyAccessToken, verifyIdToken } from "@/lib/auth/cognito";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
    readonly code = "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface Session {
  user: AuthUser;
  mode: "cognito" | "dev";
}

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge ? { maxAge } : {})
  };
}

export async function getSession(): Promise<Session | null> {
  if (isCognitoEnabled()) {
    const jar = await cookies();
    const accessToken = jar.get(AUTH_COOKIE_ACCESS)?.value;
    const idToken = jar.get(AUTH_COOKIE_ID)?.value;
    if (!accessToken && !idToken) return null;
    try {
      const user = accessToken
        ? await verifyAccessToken(accessToken)
        : await verifyIdToken(idToken as string);
      if (idToken) {
        const idUser = await verifyIdToken(idToken);
        user.email = idUser.email;
      }
      return { user, mode: "cognito" };
    } catch {
      return null;
    }
  }

  const jar = await cookies();
  const devUserId = jar.get(DEV_USER_COOKIE)?.value;
  if (!devUserId) return null;
  return {
    user: { userId: devUserId, groups: ["admin"], isAdmin: true, email: "dev@localhost" },
    mode: "dev"
  };
}

export async function requireUser(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required");
  }
  return session.user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!user.isAdmin && isCognitoEnabled()) {
    throw new AuthError("Admin access required", 403, "FORBIDDEN");
  }
  return user;
}

export async function ensureUserProfile(userId: string) {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const profile = profileFallback(userId);
  await upsertProfile({ ...profile, onboardedAt: undefined });
  return profile;
}

export function setAuthCookies(
  response: Response,
  tokens: { access_token: string; id_token: string; refresh_token?: string; expires_in: number },
  csrfToken: string
) {
  const headers = new Headers(response.headers);
  const opts = cookieOptions(tokens.expires_in);
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_ACCESS}=${tokens.access_token}; HttpOnly; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=${tokens.expires_in}`
  );
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_ID}=${tokens.id_token}; HttpOnly; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=${tokens.expires_in}`
  );
  if (tokens.refresh_token) {
    headers.append(
      "Set-Cookie",
      `${AUTH_COOKIE_REFRESH}=${tokens.refresh_token}; HttpOnly; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=${60 * 60 * 24 * 30}`
    );
  }
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_CSRF}=${csrfToken}; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=${tokens.expires_in}`
  );
  return new Response(response.body, { status: response.status, headers });
}

export function clearAuthCookies(response: Response) {
  const headers = new Headers(response.headers);
  for (const name of [AUTH_COOKIE_ACCESS, AUTH_COOKIE_ID, AUTH_COOKIE_REFRESH, AUTH_COOKIE_CSRF]) {
    headers.append(
      "Set-Cookie",
      `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
    );
  }
  return new Response(response.body, { status: response.status, headers });
}

export { cookieOptions, DEV_USER_COOKIE };
