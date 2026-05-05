import { NextResponse } from "next/server";
import { defaultProfile } from "@/lib/seed";
import { listArticles, listInteractions, getProfile, upsertRecommendationScores } from "@/lib/storage/store";
import { rankArticles, toRecommendationScore } from "@/lib/recommendation/ranking";
import { getDemoUserId } from "@/lib/user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? (await getDemoUserId());
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const profile = (await getProfile(userId)) ?? { ...defaultProfile, userId };
  const [articles, allInteractions, userInteractions] = await Promise.all([
    listArticles(),
    listInteractions(),
    listInteractions(userId)
  ]);
  const ranked = rankArticles({
    articles,
    profile,
    allInteractions,
    userInteractions,
    limit
  });
  await upsertRecommendationScores(ranked.map((article) => toRecommendationScore(userId, article)));
  return NextResponse.json({ articles: ranked, profile });
}
