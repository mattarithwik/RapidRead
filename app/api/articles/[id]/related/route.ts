import { NextResponse } from "next/server";
import { relatedQuerySchema } from "@/lib/api/schemas";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import { rankRelatedArticles } from "@/lib/recommendation/ranking";
import {
  getArticle,
  listInteractions,
  queryRecentArticles
} from "@/lib/storage/store";

export const runtime = "nodejs";

export const GET = withGuards(
  async (request, { userId, params }) => {
    const { id } = (await params) ?? {};
    const url = new URL(request.url);
    const parsed = relatedQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const source = await getArticle(id);
    if (!source) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const profile = await ensureUserProfile(userId!);
    const [{ articles }, userInteractions] = await Promise.all([
      queryRecentArticles({
        limit: 120,
        countries: profile.selectedCountries,
        topics: profile.selectedTopics
      }),
      listInteractions(userId)
    ]);

    const related = rankRelatedArticles({
      source,
      candidates: articles,
      profile,
      userInteractions,
      limit: parsed.limit ?? 6
    });

    return NextResponse.json({ articles: related, sourceId: source.articleId });
  },
  { querySchema: relatedQuerySchema }
);
