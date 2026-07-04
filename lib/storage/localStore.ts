import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Article,
  Interaction,
  NewsStoreSnapshot,
  RecommendationScore,
  UserProfile
} from "@/lib/types";
import { seedSnapshot } from "@/lib/seed";
import type { ArticleQueryOptions, ArticleQueryResult, NewsStore } from "@/lib/storage/types";

const dataDir = path.join(process.cwd(), ".data");
const storePath = path.join(dataDir, "news-store.json");

async function ensureStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(seedSnapshot, null, 2), "utf8");
  }
}

export async function readStore(): Promise<NewsStoreSnapshot> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as NewsStoreSnapshot;
}

export async function writeStore(snapshot: NewsStoreSnapshot): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function resetStore(snapshot: NewsStoreSnapshot = seedSnapshot): Promise<void> {
  await writeStore(snapshot);
}

function filterArticles(articles: Article[], options: ArticleQueryOptions = {}): ArticleQueryResult {
  const since = options.since ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const offset = options.cursor ? Number(Buffer.from(options.cursor, "base64url").toString("utf8")) : 0;
  const limit = options.limit ?? 200;

  let filtered = articles
    .filter((article) => Date.parse(article.publishedAt) >= Date.parse(since))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  if (options.countries?.length) {
    filtered = filtered.filter((article) => options.countries?.includes(article.sourceCountry));
  }
  if (options.topics?.length) {
    filtered = filtered.filter((article) =>
      article.topics.some((topic) => options.topics?.includes(topic))
    );
  }

  const page = filtered.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  return {
    articles: page,
    nextCursor:
      nextOffset < filtered.length
        ? Buffer.from(String(nextOffset)).toString("base64url")
        : undefined
  };
}

export async function queryRecentArticles(options?: ArticleQueryOptions): Promise<ArticleQueryResult> {
  const snapshot = await readStore();
  return filterArticles(snapshot.articles, options);
}

export async function listArticles(): Promise<Article[]> {
  const result = await queryRecentArticles({ limit: Number(process.env.INGEST_MAX_ARTICLES ?? 200) });
  return result.articles;
}

export async function getArticle(articleId: string): Promise<Article | undefined> {
  const snapshot = await readStore();
  return snapshot.articles.find((article) => article.articleId === articleId);
}

export async function upsertArticles(articles: Article[]): Promise<void> {
  const snapshot = await readStore();
  const byId = new Map(snapshot.articles.map((article) => [article.articleId, article]));
  for (const article of articles) {
    byId.set(article.articleId, { ...byId.get(article.articleId), ...article });
  }
  snapshot.articles = Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );
  await writeStore(snapshot);
}

export async function updateArticle(article: Article): Promise<void> {
  const snapshot = await readStore();
  snapshot.articles = snapshot.articles.map((item) =>
    item.articleId === article.articleId ? article : item
  );
  await writeStore(snapshot);
}

export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  const snapshot = await readStore();
  return snapshot.profiles.find((profile) => profile.userId === userId);
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
  const snapshot = await readStore();
  const existingIndex = snapshot.profiles.findIndex((item) => item.userId === profile.userId);
  if (existingIndex >= 0) {
    snapshot.profiles[existingIndex] = profile;
  } else {
    snapshot.profiles.push(profile);
  }
  await writeStore(snapshot);
}

export async function listInteractions(userId?: string): Promise<Interaction[]> {
  const snapshot = await readStore();
  return userId
    ? snapshot.interactions.filter((interaction) => interaction.userId === userId)
    : snapshot.interactions;
}

export async function addInteraction(interaction: Interaction): Promise<void> {
  const snapshot = await readStore();
  snapshot.interactions.push(interaction);
  snapshot.recommendationScores = snapshot.recommendationScores.filter(
    (score) => score.userId !== interaction.userId
  );
  await writeStore(snapshot);
}

export async function upsertRecommendationScores(scores: RecommendationScore[]): Promise<void> {
  const snapshot = await readStore();
  const freshScores = snapshot.recommendationScores.filter((score) => {
    const replacing = scores.some(
      (item) => item.userId === score.userId && item.articleId === score.articleId
    );
    return !replacing;
  });
  snapshot.recommendationScores = [...freshScores, ...scores];
  await writeStore(snapshot);
}

export async function deleteUserData(userId: string): Promise<void> {
  const snapshot = await readStore();
  snapshot.profiles = snapshot.profiles.filter((profile) => profile.userId !== userId);
  snapshot.interactions = snapshot.interactions.filter(
    (interaction) => interaction.userId !== userId
  );
  snapshot.recommendationScores = snapshot.recommendationScores.filter(
    (score) => score.userId !== userId
  );
  await writeStore(snapshot);
}

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const snapshot = await readStore();
  return {
    profile: snapshot.profiles.find((profile) => profile.userId === userId),
    interactions: snapshot.interactions.filter((interaction) => interaction.userId === userId),
    recommendationScores: snapshot.recommendationScores.filter((score) => score.userId === userId),
    exportedAt: new Date().toISOString()
  };
}

export const localStore: NewsStore = {
  readStore,
  writeStore,
  resetStore,
  listArticles,
  queryRecentArticles,
  getArticle,
  upsertArticles,
  updateArticle,
  getProfile,
  upsertProfile,
  listInteractions,
  addInteraction,
  upsertRecommendationScores,
  deleteUserData,
  exportUserData
};
