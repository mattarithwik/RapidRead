import type { CountryCode, Topic } from "@/lib/types";
import type {
  Article,
  Interaction,
  NewsStoreSnapshot,
  RecommendationScore,
  UserProfile
} from "@/lib/types";

export interface ArticleQueryOptions {
  limit?: number;
  cursor?: string;
  since?: string;
  countries?: CountryCode[];
  topics?: Topic[];
}

export interface ArticleQueryResult {
  articles: Article[];
  nextCursor?: string;
}

export interface NewsStore {
  readStore(): Promise<NewsStoreSnapshot>;
  writeStore(snapshot: NewsStoreSnapshot): Promise<void>;
  resetStore(snapshot?: NewsStoreSnapshot): Promise<void>;
  listArticles(): Promise<Article[]>;
  queryRecentArticles(options?: ArticleQueryOptions): Promise<ArticleQueryResult>;
  getArticle(articleId: string): Promise<Article | undefined>;
  upsertArticles(articles: Article[]): Promise<void>;
  updateArticle(article: Article): Promise<void>;
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(profile: UserProfile): Promise<void>;
  listInteractions(userId?: string): Promise<Interaction[]>;
  addInteraction(interaction: Interaction): Promise<void>;
  upsertRecommendationScores(scores: RecommendationScore[]): Promise<void>;
  deleteUserData(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<Record<string, unknown>>;
}
