import { describe, expect, it } from "vitest";
import { computeUserCentroid } from "@/lib/recommendation/ranking";
import type { Article, Interaction } from "@/lib/types";

const baseArticle: Article = {
  articleId: "base",
  title: "Base",
  sourceId: "source",
  sourceName: "Source",
  sourceCountry: "US",
  url: "https://example.com",
  canonicalUrl: "https://example.com",
  publishedAt: "2026-05-04T10:00:00.000Z",
  ingestedAt: "2026-05-04T10:00:00.000Z",
  excerpt: "",
  topics: ["AI"],
  entities: [],
  sentiment: "neutral",
  embedding: [0, 0],
  enriched: true,
  enrichmentAttempts: 1
};

describe("computeUserCentroid", () => {
  it("averages embeddings from liked and saved articles", () => {
    const articles: Article[] = [
      { ...baseArticle, articleId: "a", embedding: [1, 3] },
      { ...baseArticle, articleId: "b", embedding: [3, 5] }
    ];
    const interactions: Interaction[] = [
      { userId: "u", articleId: "a", action: "like", sessionId: "s", timestamp: "2026-05-04T10:00:00.000Z" },
      { userId: "u", articleId: "b", action: "save", sessionId: "s", timestamp: "2026-05-04T10:00:00.000Z" }
    ];

    expect(computeUserCentroid(interactions, articles)).toEqual([2, 4]);
  });

  it("includes clicks with a lower weight than likes and saves", () => {
    const articles: Article[] = [
      { ...baseArticle, articleId: "a", embedding: [0, 0] },
      { ...baseArticle, articleId: "b", embedding: [10, 10] }
    ];
    const interactions: Interaction[] = [
      { userId: "u", articleId: "a", action: "like", sessionId: "s", timestamp: "2026-05-04T10:00:00.000Z" },
      { userId: "u", articleId: "b", action: "click", sessionId: "s", timestamp: "2026-05-04T10:00:00.000Z" }
    ];

    const centroid = computeUserCentroid(interactions, articles);
    expect(centroid?.[0]).toBeGreaterThan(0);
    expect(centroid?.[0]).toBeLessThan(5);
  });
});
