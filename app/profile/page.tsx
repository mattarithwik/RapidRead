import { countryLabel } from "@/lib/constants";
import { defaultProfile } from "@/lib/seed";
import { summarizeInferredInterests } from "@/lib/recommendation/ranking";
import { getProfile, listArticles, listInteractions } from "@/lib/storage/store";
import { getDemoUserId } from "@/lib/user";

export default async function ProfilePage() {
  const userId = await getDemoUserId();
  const profile = (await getProfile(userId)) ?? { ...defaultProfile, userId };
  const [articles, interactions] = await Promise.all([listArticles(), listInteractions(userId)]);
  const inferredInterests = summarizeInferredInterests(interactions, articles);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Your recommendation signals.</h1>
          <p className="lede">
            This dashboard shows the explicit preferences and feedback events that shape the feed.
          </p>
        </div>
      </section>
      <section className="profile-grid">
        <div className="stat-panel">
          <h2>Selected Topics</h2>
          <div className="chips">
            {profile.selectedTopics.map((topic) => (
              <span className="chip" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-panel">
          <h2>Selected Countries</h2>
          <div className="chips">
            {profile.selectedCountries.map((country) => (
              <span className="chip country" key={country}>
                {countryLabel(country)}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-panel">
          <h2>Inferred Interests</h2>
          <div className="chips">
            {inferredInterests.length ? (
              inferredInterests.map((item) => (
                <span className="chip" key={item.topic}>
                  {item.topic} · {item.count}
                </span>
              ))
            ) : (
              <p className="meta">Like or save articles to build an interest centroid.</p>
            )}
          </div>
        </div>
        <div className="stat-panel">
          <h2>Recent Feedback</h2>
          {interactions.length ? (
            interactions
              .slice(-6)
              .reverse()
              .map((interaction) => (
                <p className="meta" key={`${interaction.timestamp}-${interaction.articleId}`}>
                  {interaction.action} · {new Date(interaction.timestamp).toLocaleString()}
                </p>
              ))
          ) : (
            <p className="meta">No feedback yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
