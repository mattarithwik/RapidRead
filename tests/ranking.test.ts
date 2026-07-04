import { describe, expect, it } from "vitest";
import type { Article, Interaction, UserProfile } from "@/lib/types";
import { rankArticles } from "@/lib/recommendation/ranking";

const now = new Date("2026-05-04T12:00:00.000Z");

function article(overrides: Partial<Article>): Article {
  return {
    articleId: "article",
    title: "Article",
    sourceId: "source",
    sourceName: "Source",
    sourceCountry: "US",
    url: "https://example.com/article",
    canonicalUrl: "https://example.com/article",
    publishedAt: "2026-05-04T10:00:00.000Z",
    ingestedAt: "2026-05-04T10:10:00.000Z",
    excerpt: "Excerpt",
    topics: ["AI"],
    entities: [],
    sentiment: "neutral",
    embedding: [1, 0, 0],
    enriched: true,
    enrichmentAttempts: 1,
    ...overrides
  };
}

const profile: UserProfile = {
  userId: "user",
  selectedTopics: ["AI"],
  selectedCountries: ["US"],
  followedEntities: [],
  mutedTopics: [],
  hiddenSources: [],
  onboardedAt: now.toISOString(),
  lastActiveAt: now.toISOString()
};

describe("rankArticles", () => {
  it("prioritizes topic and country matches during cold start", () => {
    const ranked = rankArticles({
      articles: [
        article({ articleId: "ai-us", topics: ["AI"], sourceCountry: "US" }),
        article({ articleId: "sports-gb", topics: ["Sports"], sourceCountry: "GB" })
      ],
      profile,
      userInteractions: [],
      allInteractions: [],
      now
    });

    expect(ranked[0].articleId).toBe("ai-us");
    expect(ranked[0].signalBreakdown.coldStart).toBe(true);
    expect(ranked[0].signalBreakdown.countryMatch).toBe(1);
  });

  it("uses semantic similarity after enough interactions", () => {
    const liked = article({ articleId: "liked", embedding: [1, 0, 0] });
    const similar = article({ articleId: "similar", embedding: [0.95, 0.05, 0] });
    const distant = article({ articleId: "distant", embedding: [0, 1, 0] });
    const interactions: Interaction[] = Array.from({ length: 5 }).map((_, index) => ({
      userId: "user",
      articleId: "liked",
      action: index === 0 ? "like" : "click",
      sessionId: "test",
      timestamp: now.toISOString()
    }));

    const ranked = rankArticles({
      articles: [distant, similar, liked],
      profile,
      userInteractions: interactions,
      allInteractions: interactions,
      now
    });

    expect(ranked[0].articleId).not.toBe("distant");
    expect(ranked.find((item) => item.articleId === "similar")?.signalBreakdown.semanticSimilarity).toBeGreaterThan(
      ranked.find((item) => item.articleId === "distant")?.signalBreakdown.semanticSimilarity ?? 1
    );
  });

  it("boosts articles similar to recent clicks", () => {
    const clicked = article({ articleId: "clicked", embedding: [1, 0, 0] });
    const similar = article({ articleId: "similar", embedding: [0.95, 0.05, 0] });
    const distant = article({ articleId: "distant", embedding: [0, 1, 0] });
    const interactions: Interaction[] = Array.from({ length: 5 }).map((_, index) => ({
      userId: "user",
      articleId: "clicked",
      action: index === 0 ? "like" : "click",
      sessionId: "test",
      timestamp: now.toISOString()
    }));

    const ranked = rankArticles({
      articles: [distant, similar, clicked],
      profile,
      userInteractions: interactions,
      allInteractions: interactions,
      now
    });

    expect(
      ranked.find((item) => item.articleId === "similar")?.signalBreakdown.recentClickAffinity
    ).toBeGreaterThan(
      ranked.find((item) => item.articleId === "distant")?.signalBreakdown.recentClickAffinity ?? 1
    );
  });

  it("filters disliked articles from the next ranking output", () => {
    const disliked = article({ articleId: "disliked" });
    const replacement = article({ articleId: "replacement", title: "Replacement" });
    const interactions: Interaction[] = [
      {
        userId: "user",
        articleId: "disliked",
        action: "dislike",
        sessionId: "test",
        timestamp: now.toISOString()
      }
    ];

    const ranked = rankArticles({
      articles: [disliked, replacement],
      profile,
      userInteractions: interactions,
      allInteractions: interactions,
      now
    });

    expect(ranked.map((item) => item.articleId)).not.toContain("disliked");
  });
});
