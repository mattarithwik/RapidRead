export const AUTH_COOKIE_ACCESS = "rr_access_token";
export const AUTH_COOKIE_ID = "rr_id_token";
export const AUTH_COOKIE_REFRESH = "rr_refresh_token";
export const AUTH_COOKIE_CSRF = "rr_csrf_token";
export const DEV_USER_COOKIE = "news_demo_user";

export function isCognitoEnabled(): boolean {
  return Boolean(
    process.env.COGNITO_USER_POOL_ID &&
      process.env.COGNITO_USER_POOL_CLIENT_ID &&
      process.env.COGNITO_DOMAIN
  );
}

export function getCognitoConfig() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID;
  const domain = process.env.COGNITO_DOMAIN;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;
  const region = process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? "us-east-1";

  if (!userPoolId || !clientId || !domain) {
    throw new Error("Cognito is not configured.");
  }

  return { userPoolId, clientId, domain, clientSecret, region };
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function getRedirectUri(): string {
  return `${getAppBaseUrl()}/api/auth/callback`;
}

export function getLogoutRedirectUri(): string {
  return `${getAppBaseUrl()}/`;
}
