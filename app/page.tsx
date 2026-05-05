import { PreferenceForm } from "@/components/PreferenceForm";
import { ArticleCard } from "@/components/ArticleCard";
import { profileFallback } from "@/lib/seed";
import { getProfile, listArticles, listInteractions, upsertRecommendationScores } from "@/lib/storage/store";
import { rankArticles, toRecommendationScore } from "@/lib/recommendation/ranking";
import { getDemoUserId } from "@/lib/user";
import { countryLabel } from "@/lib/constants";

export default async function HomePage() {
  const userId = await getDemoUserId();
  const profile = (await getProfile(userId)) ?? profileFallback(userId);
  const [articles, allInteractions, userInteractions] = await Promise.all([
    listArticles(),
    listInteractions(),
    listInteractions(userId)
  ]);
  const ranked = rankArticles({ articles, profile, allInteractions, userInteractions, limit: 12 });
  await upsertRecommendationScores(ranked.map((article) => toRecommendationScore(userId, article)));
  const needsOnboarding = !profile.onboardedAt;

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">RapidRead</p>
          <h1>Your fast, personalized world brief.</h1>
          <p className="lede">
            Recommendations combine topic fit, country preferences, recency, feedback, semantic
            similarity, source diversity, and popularity.
          </p>
        </div>
      </section>

      {needsOnboarding ? (
        <PreferenceForm mode="onboarding" profile={profile} />
      ) : (
        <div className="grid">
          <section className="feed">
            {ranked.length ? (
              ranked.map((article, index) => (
                <ArticleCard key={article.articleId} article={article} rank={index + 1} />
              ))
            ) : (
              <div className="empty">No articles match the current filters.</div>
            )}
          </section>
          <aside className="side-panel">
            <div>
              <h2>Current Preferences</h2>
              <p className="meta">These settings are used by the ranking model.</p>
            </div>
            <div>
              <p className="eyebrow">Topics</p>
              <div className="chips">
                {profile.selectedTopics.map((topic) => (
                  <span className="chip" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Countries</p>
              <div className="chips">
                {profile.selectedCountries.map((country) => (
                  <span className="chip country" key={country}>
                    {countryLabel(country)}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
