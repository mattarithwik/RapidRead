import { NextResponse } from "next/server";
import { feedQuerySchema } from "@/lib/api/schemas";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import { emitMetric } from "@/lib/log";
import { profileFallback } from "@/lib/seed";
import {
  listInteractions,
  queryRecentArticles,
  upsertRecommendationScores
} from "@/lib/storage/store";
import { rankArticles, toRecommendationScore } from "@/lib/recommendation/ranking";

export const runtime = "nodejs";

function decodeOffset(cursor?: string): number {
  if (!cursor) return 0;
  try {
    return Number(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    return 0;
  }
}

function encodeOffset(offset: number, total: number, limit: number): string | undefined {
  const next = offset + limit;
  return next < total ? Buffer.from(String(next)).toString("base64url") : undefined;
}

export const GET = withGuards(
  async (request, { userId, requestId }) => {
    const start = Date.now();
    const url = new URL(request.url);
    const parsed = feedQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const limit = parsed.limit ?? 20;
    const offset = decodeOffset(parsed.cursor);
    const profile = (await ensureUserProfile(userId!)) ?? profileFallback(userId!);
    const [{ articles }, allInteractions, userInteractions] = await Promise.all([
      queryRecentArticles({
        limit: Number(process.env.INGEST_MAX_ARTICLES ?? 200),
        countries: profile.selectedCountries,
        topics: profile.selectedTopics
      }),
      listInteractions(),
      listInteractions(userId)
    ]);

    const rankedAll = rankArticles({
      articles,
      profile,
      allInteractions,
      userInteractions,
      limit: articles.length
    });
    const ranked = rankedAll.slice(offset, offset + limit);
    await upsertRecommendationScores(ranked.map((article) => toRecommendationScore(userId!, article)));
    emitMetric("FeedLatencyMs", Date.now() - start, "Milliseconds");

    return NextResponse.json({
      articles: ranked,
      profile,
      nextCursor: encodeOffset(offset, rankedAll.length, limit),
      requestId
    });
  },
  { querySchema: feedQuerySchema }
);
