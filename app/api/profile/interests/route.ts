import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import { listArticles, listInteractions } from "@/lib/storage/store";
import { summarizeInferredInterests } from "@/lib/recommendation/ranking";

export const runtime = "nodejs";

export const GET = withGuards(async (_request, { userId }) => {
  const profile = await ensureUserProfile(userId!);
  const [articles, interactions] = await Promise.all([listArticles(), listInteractions(userId)]);
  return NextResponse.json({
    profile,
    inferredInterests: summarizeInferredInterests(interactions, articles),
    recentFeedback: interactions.slice(-10).reverse()
  });
});
