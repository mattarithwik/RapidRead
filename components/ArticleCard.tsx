"use client";

import Link from "next/link";
import { countryLabel } from "@/lib/constants";
import type { RankedArticle } from "@/lib/types";
import { ArticleActions } from "@/components/ArticleActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch, useCsrfToken } from "@/components/providers/CsrfProvider";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface ArticleCardProps {
  article: RankedArticle;
  rank: number;
  compact?: boolean;
  onRemoved?: () => void;
}

export function ArticleCard({ article, rank, compact = false, onRemoved }: ArticleCardProps) {
  const csrfToken = useCsrfToken();

  async function recordClick() {
    await apiFetch(
      "/api/interactions",
      {
        method: "POST",
        body: JSON.stringify({ articleId: article.articleId, action: "click", rankAtTime: rank }),
        keepalive: true
      },
      csrfToken
    );
  }

  return (
    <Card className={cn("transition hover:-translate-y-0.5 hover:shadow-md", compact && "shadow-none")}>
      <CardHeader className={cn("space-y-3", compact && "p-4")}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {article.sourceName} · {countryLabel(article.sourceCountry)} ·{" "}
              {new Date(article.publishedAt).toLocaleString()}
            </p>
            <Link href={`/article/${article.articleId}`} onClick={() => void recordClick()}>
              <h2 className={cn("font-serif font-semibold leading-tight hover:text-primary", compact ? "text-lg" : "text-2xl")}>
                {article.title}
              </h2>
            </Link>
          </div>
          {!compact ? (
            <Badge className="shrink-0 bg-primary/10 text-primary">{Math.round(article.finalScore * 100)}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "p-4 pt-0")}>
        <p className="text-sm leading-6 text-foreground/90">{article.summary || article.excerpt}</p>
        <div className="flex flex-wrap gap-2">
          {article.topics.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
          <Badge variant="outline">{article.sentiment}</Badge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">{article.explanation}</p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="Score breakdown">
                <Info className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="text-xs">
              <div className="space-y-1">
                <p>Topic {Math.round(article.signalBreakdown.topicMatch * 100)}%</p>
                <p>Semantic {Math.round(article.signalBreakdown.semanticSimilarity * 100)}%</p>
                <p>Recent clicks {Math.round(article.signalBreakdown.recentClickAffinity * 100)}%</p>
                <p>Country {Math.round(article.signalBreakdown.countryMatch * 100)}%</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ArticleActions
          articleId={article.articleId}
          rank={rank}
          onActionComplete={onRemoved}
        />
      </CardContent>
    </Card>
  );
}
