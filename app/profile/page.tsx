import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { countryLabel } from "@/lib/constants";
import { ensureUserProfile, getSession } from "@/lib/auth/session";
import { summarizeInferredInterests } from "@/lib/recommendation/ranking";
import { listArticles, listInteractions } from "@/lib/storage/store";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const profile = await ensureUserProfile(session.user.userId);
  const [articles, interactions] = await Promise.all([
    listArticles(),
    listInteractions(session.user.userId)
  ]);
  const inferredInterests = summarizeInferredInterests(interactions, articles);

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Your recommendation signals."
        description="This dashboard shows the explicit preferences and feedback events that shape the feed."
      />
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-lg font-semibold">Selected topics</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.selectedTopics.map((topic) => (
              <Badge key={topic}>{topic}</Badge>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-lg font-semibold">Selected countries</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.selectedCountries.map((country) => (
              <Badge key={country} className="bg-accent text-accent-foreground">
                {countryLabel(country)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-lg font-semibold">Inferred interests</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {inferredInterests.length ? (
              inferredInterests.map((item) => (
                <Badge key={item.topic} variant="outline">
                  {item.topic} · {item.count}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Like or save articles to build an interest centroid.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-lg font-semibold">Recent feedback</h2>
          <div className="mt-3 space-y-2">
            {interactions.length ? (
              interactions
                .slice(-6)
                .reverse()
                .map((interaction) => (
                  <p className="text-sm text-muted-foreground" key={`${interaction.timestamp}-${interaction.articleId}`}>
                    {interaction.action} · {new Date(interaction.timestamp).toLocaleString()}
                  </p>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
