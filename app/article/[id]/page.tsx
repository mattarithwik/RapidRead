import Link from "next/link";
import { notFound } from "next/navigation";
import { countryLabel } from "@/lib/constants";
import { getArticle } from "@/lib/storage/localStore";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <div className="page detail-layout">
      <p className="eyebrow">
        {article.sourceName} · {countryLabel(article.sourceCountry)}
      </p>
      <h1>{article.title}</h1>
      <p className="lede">{article.summary || article.excerpt}</p>
      <div className="chips" style={{ margin: "22px 0" }}>
        {article.topics.map((topic) => (
          <span className="chip" key={topic}>
            {topic}
          </span>
        ))}
        {article.entities.map((entity) => (
          <span className="chip" key={entity}>
            {entity}
          </span>
        ))}
        <span className="chip">{article.sentiment}</span>
      </div>
      <p className="summary">{article.excerpt}</p>
      <p>
        <a className="external-link" href={article.url} target="_blank" rel="noreferrer">
          Read original source
        </a>
      </p>
      <p>
        <Link className="secondary-button" href="/">
          Back to feed
        </Link>
      </p>
    </div>
  );
}
