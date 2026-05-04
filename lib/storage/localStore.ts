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

export async function listArticles(): Promise<Article[]> {
  const snapshot = await readStore();
  return snapshot.articles;
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
