import { describe, expect, it } from "vitest";
import type { Article, UserProfile } from "@/lib/types";
import { rankArticles } from "@/lib/recommendation/ranking";

const profile: UserProfile = {
  userId: "u",
  selectedTopics: ["Business"],
  selectedCountries: ["IN"],
  followedEntities: [],
  mutedTopics: [],
  hiddenSources: [],
  onboardedAt: "2026-05-04T10:00:00.000Z",
  lastActiveAt: "2026-05-04T10:00:00.000Z"
};

function article(articleId: string, country: Article["sourceCountry"]): Article {
  return {
    articleId,
    title: articleId,
    sourceId: `source-${country}`,
    sourceName: `Source ${country}`,
    sourceCountry: country,
    url: `https://example.com/${articleId}`,
    canonicalUrl: `https://example.com/${articleId}`,
    publishedAt: "2026-05-04T09:00:00.000Z",
    ingestedAt: "2026-05-04T09:00:00.000Z",
    excerpt: "",
    topics: ["Business"],
    entities: [],
    sentiment: "neutral",
    embedding: [1, 1],
    enriched: true,
    enrichmentAttempts: 1
  };
}

describe("country ranking", () => {
  it("scores selected country above unrelated countries", () => {
    const ranked = rankArticles({
      articles: [article("gb", "GB"), article("in", "IN"), article("global", "GLOBAL")],
      profile,
      userInteractions: [],
      allInteractions: [],
      now: new Date("2026-05-04T10:00:00.000Z")
    });

    expect(ranked[0].articleId).toBe("in");
    expect(ranked.find((item) => item.articleId === "global")?.signalBreakdown.countryMatch).toBe(0.65);
    expect(ranked.find((item) => item.articleId === "gb")?.signalBreakdown.countryMatch).toBe(0);
  });
});
