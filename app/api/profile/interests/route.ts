import { NextResponse } from "next/server";
import { profileFallback } from "@/lib/seed";
import { getProfile, listArticles, listInteractions } from "@/lib/storage/store";
import { summarizeInferredInterests } from "@/lib/recommendation/ranking";
import { getDemoUserId } from "@/lib/user";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getDemoUserId();
  const profile = (await getProfile(userId)) ?? profileFallback(userId);
  const [articles, interactions] = await Promise.all([listArticles(), listInteractions(userId)]);
  return NextResponse.json({
    profile,
    inferredInterests: summarizeInferredInterests(interactions, articles),
    recentFeedback: interactions.slice(-10).reverse()
  });
}
