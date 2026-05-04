import crypto from "node:crypto";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid"
]);

export function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  for (const key of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  const pathname = url.pathname.endsWith("/") && url.pathname !== "/" ? url.pathname.slice(0, -1) : url.pathname;
  url.pathname = pathname;
  return url.toString();
}

export function articleIdFromUrl(input: string): string {
  return crypto.createHash("sha256").update(canonicalizeUrl(input)).digest("hex");
}
