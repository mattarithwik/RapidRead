"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countryLabel } from "@/lib/constants";
import type { RankedArticle, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface FeedShellProps {
  initialArticles: RankedArticle[];
  profile: UserProfile;
  initialCursor?: string;
}

export function FeedShell({ initialArticles, profile, initialCursor }: FeedShellProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [isRefreshing, startRefresh] = useTransition();
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const refreshFeed = useCallback(async () => {
    const response = await fetch("/api/feed?limit=12", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      articles: RankedArticle[];
      nextCursor?: string;
      profile: UserProfile;
    };
    setArticles(data.articles);
    setNextCursor(data.nextCursor);
  }, []);

  useEffect(() => {
    const onFocus = () => startRefresh(() => refreshFeed());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshFeed]);

  useEffect(() => {
    const interval = window.setInterval(() => startRefresh(() => refreshFeed()), 60_000);
    return () => window.clearInterval(interval);
  }, [refreshFeed]);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY <= 0) setTouchStartY(event.touches[0].clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY == null) return;
      const delta = event.touches[0].clientY - touchStartY;
      if (delta > 0 && window.scrollY <= 0) setPullDistance(Math.min(delta, 96));
    };
    const onTouchEnd = () => {
      if (pullDistance > 64) startRefresh(() => refreshFeed());
      setTouchStartY(null);
      setPullDistance(0);
    };
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshFeed, touchStartY]);

  const preferenceSummary = useMemo(
    () => ({
      topics: profile.selectedTopics,
      countries: profile.selectedCountries
    }),
    [profile.selectedCountries, profile.selectedTopics]
  );

  async function loadMore() {
    if (!nextCursor) return;
    const response = await fetch(`/api/feed?limit=12&cursor=${encodeURIComponent(nextCursor)}`);
    if (!response.ok) return;
    const data = (await response.json()) as { articles: RankedArticle[]; nextCursor?: string };
    setArticles((current) => [...current, ...data.articles]);
    setNextCursor(data.nextCursor);
  }

  function handleArticleRemoved(articleId: string) {
    setArticles((current) => current.filter((article) => article.articleId !== articleId));
  }

  return (
    <div style={{ transform: pullDistance ? `translateY(${pullDistance / 4}px)` : undefined }}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isRefreshing ? "Refreshing your feed..." : "Pull down or tap refresh to update recommendations."}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={() => startRefresh(() => refreshFeed())}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px]">
        <section className="space-y-4">
          {articles.length ? (
            articles.map((article, index) => (
              <ArticleCard
                key={article.articleId}
                article={article}
                rank={index + 1}
                onRemoved={() => handleArticleRemoved(article.articleId)}
              />
            ))
          ) : isRefreshing ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 w-full rounded-xl" />)
          ) : (
            <EmptyState
              title="No articles match your filters"
              description="Try refreshing the feed or adjusting your topic and country preferences."
            />
          )}
          {nextCursor ? (
            <Button variant="secondary" onClick={loadMore}>
              Load more
            </Button>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="font-serif text-lg font-semibold">Current preferences</h2>
            <p className="text-sm text-muted-foreground">These settings feed the ranking model.</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topics</p>
            <div className="flex flex-wrap gap-2">
              {preferenceSummary.topics.map((topic) => (
                <Badge key={topic} className="bg-secondary text-secondary-foreground">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Countries</p>
            <div className="flex flex-wrap gap-2">
              {preferenceSummary.countries.map((country) => (
                <Badge key={country} className="border-primary/20 bg-accent text-accent-foreground">
                  {countryLabel(country)}
                </Badge>
              ))}
            </div>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/settings">Edit preferences</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
