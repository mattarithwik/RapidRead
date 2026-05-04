import Parser from "rss-parser";
import type { Article } from "@/lib/types";
import { upsertArticles } from "@/lib/storage/localStore";
import { articleIdFromUrl, canonicalizeUrl } from "@/lib/news/url";
import { RSS_FEEDS, type NewsFeedSource } from "@/lib/news/feeds";
import { classifyTopics } from "@/lib/news/topicClassifier";

const parser = new Parser();

function excerptFrom(item: Parser.Item): string {
  const text = item.contentSnippet || item.content || item.summary || "";
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 320);
}

export async function ingestFeed(source: NewsFeedSource, maxArticles = 40): Promise<Article[]> {
  const feed = await parser.parseURL(source.url);
  const now = new Date().toISOString();
  return feed.items
    .filter((item) => item.link && item.title)
    .slice(0, maxArticles)
    .map((item) => {
      const canonicalUrl = canonicalizeUrl(item.link as string);
      const text = `${item.title ?? ""} ${excerptFrom(item)}`;
      return {
        articleId: articleIdFromUrl(canonicalUrl),
        title: item.title as string,
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        sourceCountry: source.sourceCountry,
        url: item.link as string,
        canonicalUrl,
        publishedAt: item.isoDate ?? item.pubDate ?? now,
        ingestedAt: now,
        rawS3Key: `raw/${source.sourceId}/${articleIdFromUrl(canonicalUrl)}.json`,
        excerpt: excerptFrom(item),
        topics: classifyTopics(text, source.topicHint),
        entities: [],
        sentiment: "neutral",
        enriched: false,
        enrichmentAttempts: 0
      } satisfies Article;
    });
}

export async function ingestAllFeeds(maxArticles = Number(process.env.INGEST_MAX_ARTICLES ?? 200)) {
  const perFeed = Math.max(1, Math.ceil(maxArticles / RSS_FEEDS.length));
  const batches = await Promise.allSettled(RSS_FEEDS.map((feed) => ingestFeed(feed, perFeed)));
  const articles = batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
  await upsertArticles(articles.slice(0, maxArticles));
  return {
    attemptedFeeds: RSS_FEEDS.length,
    storedArticles: articles.length,
    failedFeeds: batches.filter((batch) => batch.status === "rejected").length
  };
}
