import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ensureUserProfile, getSession } from "@/lib/auth/session";
import { countryLabel } from "@/lib/constants";
import { rankRelatedArticles } from "@/lib/recommendation/ranking";
import {
  addInteraction,
  getArticle,
  listInteractions,
  queryRecentArticles
} from "@/lib/storage/store";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const profile = await ensureUserProfile(session.user.userId);
  const timestamp = new Date().toISOString();
  await addInteraction({
    userId: session.user.userId,
    articleId: article.articleId,
    action: "click",
    sessionId: "article-detail",
    timestamp
  });

  const [{ articles }, userInteractions] = await Promise.all([
    queryRecentArticles({
      limit: 120,
      countries: profile.selectedCountries,
      topics: profile.selectedTopics
    }),
    listInteractions(session.user.userId)
  ]);

  const related = rankRelatedArticles({
    source: article,
    candidates: articles,
    profile,
    userInteractions,
    limit: 6
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow={`${article.sourceName} · ${countryLabel(article.sourceCountry)}`}
        title={article.title}
        description={article.summary || article.excerpt}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {article.topics.map((topic) => (
          <Badge key={topic} variant="outline">
            {topic}
          </Badge>
        ))}
        {article.entities.map((entity) => (
          <Badge key={entity} variant="secondary">
            {entity}
          </Badge>
        ))}
        <Badge variant="outline">{article.sentiment}</Badge>
      </div>

      <p className="text-base leading-7 text-foreground/90">{article.excerpt}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href={article.url} target="_blank" rel="noreferrer">
            Read original source
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to feed</Link>
        </Button>
      </div>

      <Section title="More like this">
        <div className="grid gap-4 md:grid-cols-2">
          {related.length ? (
            related.map((item, index) => (
              <ArticleCard key={item.articleId} article={item} rank={index + 1} compact />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No related stories yet. Open more articles to refine this rail.</p>
          )}
        </div>
      </Section>
    </div>
  );
}
