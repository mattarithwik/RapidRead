import { redirect } from "next/navigation";
import { PreferenceForm } from "@/components/PreferenceForm";
import { FeedShell } from "@/components/feed/FeedShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ensureUserProfile, getSession } from "@/lib/auth/session";
import {
  listInteractions,
  queryRecentArticles,
  upsertRecommendationScores
} from "@/lib/storage/store";
import { rankArticles, toRecommendationScore } from "@/lib/recommendation/ranking";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const userId = session.user.userId;
  const profile = await ensureUserProfile(userId);
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
  const ranked = rankedAll.slice(0, 12);
  await upsertRecommendationScores(ranked.map((article) => toRecommendationScore(userId, article)));
  const needsOnboarding = !profile.onboardedAt;
  const nextCursor =
    rankedAll.length > 12 ? Buffer.from("12").toString("base64url") : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="RapidRead"
        title="Your fast, personalized world brief."
        description="Recommendations combine topic fit, country preferences, recency, feedback, semantic similarity, recent clicks, source diversity, and popularity."
      />

      {needsOnboarding ? (
        <PreferenceForm mode="onboarding" profile={profile} />
      ) : (
        <FeedShell initialArticles={ranked} profile={profile} initialCursor={nextCursor} />
      )}
    </div>
  );
}
