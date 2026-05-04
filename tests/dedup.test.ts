import { describe, expect, it } from "vitest";
import { articleIdFromUrl, canonicalizeUrl } from "@/lib/news/url";

describe("canonicalizeUrl", () => {
  it("removes tracking params and normalizes trailing slashes", () => {
    const a = canonicalizeUrl("https://example.com/story/?utm_source=x&id=10#section");
    const b = canonicalizeUrl("https://example.com/story?id=10");
    expect(a).toBe(b);
    expect(articleIdFromUrl(a)).toBe(articleIdFromUrl(b));
  });
});
