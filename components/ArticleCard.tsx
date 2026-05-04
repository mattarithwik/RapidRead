import Link from "next/link";
import { countryLabel } from "@/lib/constants";
import type { RankedArticle } from "@/lib/types";
import { ArticleActions } from "@/components/ArticleActions";

interface ArticleCardProps {
  article: RankedArticle;
  rank: number;
}

export function ArticleCard({ article, rank }: ArticleCardProps) {
  return (
    <article className="article-card">
      <header>
        <div>
          <p className="meta">
            {article.sourceName} · {countryLabel(article.sourceCountry)} ·{" "}
            {new Date(article.publishedAt).toLocaleString()}
          </p>
          <Link href={`/article/${article.articleId}`}>
            <h2>{article.title}</h2>
          </Link>
        </div>
        <span className="chip country">{Math.round(article.finalScore * 100)} score</span>
      </header>
      <p className="summary">{article.summary || article.excerpt}</p>
      <div className="chips">
        {article.topics.map((topic) => (
          <span className="chip" key={topic}>
            {topic}
          </span>
        ))}
        <span className="chip">{article.sentiment}</span>
      </div>
      <p className="explanation">{article.explanation}</p>
      <ArticleActions articleId={article.articleId} rank={rank} />
    </article>
  );
}
