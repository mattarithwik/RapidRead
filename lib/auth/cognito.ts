import { CognitoJwtVerifier } from "aws-jwt-verify";
import { getCognitoConfig, getRedirectUri, getLogoutRedirectUri, isCognitoEnabled } from "@/lib/auth/config";

export interface AuthUser {
  userId: string;
  email?: string;
  groups: string[];
  isAdmin: boolean;
}

let accessVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;
let idVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getAccessVerifier() {
  if (!accessVerifier) {
    const { userPoolId, clientId } = getCognitoConfig();
    accessVerifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "access",
      clientId
    });
  }
  return accessVerifier;
}

function getIdVerifier() {
  if (!idVerifier) {
    const { userPoolId, clientId } = getCognitoConfig();
    idVerifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId
    });
  }
  return idVerifier;
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  if (!isCognitoEnabled()) {
    throw new Error("Cognito is not enabled.");
  }
  const payload = await getAccessVerifier().verify(token);
  const groups = Array.isArray(payload["cognito:groups"])
    ? (payload["cognito:groups"] as string[])
    : [];
  return {
    userId: payload.sub,
    groups,
    isAdmin: groups.includes("admin")
  };
}

export async function verifyIdToken(token: string): Promise<AuthUser> {
  if (!isCognitoEnabled()) {
    throw new Error("Cognito is not enabled.");
  }
  const payload = await getIdVerifier().verify(token);
  const groups = Array.isArray(payload["cognito:groups"])
    ? (payload["cognito:groups"] as string[])
    : [];
  return {
    userId: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    groups,
    isAdmin: groups.includes("admin")
  };
}

export function buildAuthorizeUrl(state: string): string {
  const { domain, clientId } = getCognitoConfig();
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state
  });
  return `https://${domain}/oauth2/authorize?${params.toString()}`;
}

export function buildLogoutUrl(): string {
  const { domain, clientId } = getCognitoConfig();
  const logoutUri = encodeURIComponent(getLogoutRedirectUri());
  return `https://${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const { domain, clientId, clientSecret } = getCognitoConfig();
  const redirectUri = getRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const response = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers,
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  return response.json();
}
