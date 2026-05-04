export type Topic =
  | "AI"
  | "Climate"
  | "Business"
  | "Health"
  | "Science"
  | "Politics"
  | "Technology"
  | "Sports";

export type CountryCode =
  | "US"
  | "GB"
  | "CA"
  | "IN"
  | "AU"
  | "DE"
  | "FR"
  | "JP"
  | "GLOBAL";

export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export type InteractionAction =
  | "click"
  | "save"
  | "like"
  | "dislike"
  | "hide_source"
  | "mute_topic";

export interface Article {
  articleId: string;
  title: string;
  sourceId: string;
  sourceName: string;
  sourceCountry: CountryCode;
  url: string;
  canonicalUrl: string;
  publishedAt: string;
  ingestedAt: string;
  rawS3Key?: string;
  excerpt: string;
  summary?: string;
  topics: Topic[];
  entities: string[];
  sentiment: Sentiment;
  embedding?: number[];
  enriched: boolean;
  enrichedAt?: string;
  enrichmentAttempts: number;
  enrichedFailed?: boolean;
}

export interface UserProfile {
  userId: string;
  selectedTopics: Topic[];
  selectedCountries: CountryCode[];
  followedEntities: string[];
  mutedTopics: Topic[];
  hiddenSources: string[];
  onboardedAt?: string;
  lastActiveAt: string;
}

export interface Interaction {
  userId: string;
  articleId: string;
  action: InteractionAction;
  sessionId: string;
  rankAtTime?: number;
  timestamp: string;
}

export interface RecommendationScore {
  userId: string;
  articleId: string;
  finalScore: number;
  signalBreakdown: SignalBreakdown;
  explanation: string;
  generatedAt: string;
  ttl: number;
}

export interface SignalBreakdown {
  topicMatch: number;
  semanticSimilarity: number;
  countryMatch: number;
  recency: number;
  feedback: number;
  sourceDiversity: number;
  popularity: number;
  coldStart: boolean;
  filteredReason?: string;
}

export interface RankedArticle extends Article {
  finalScore: number;
  signalBreakdown: SignalBreakdown;
  explanation: string;
}

export interface NewsStoreSnapshot {
  articles: Article[];
  profiles: UserProfile[];
  interactions: Interaction[];
  recommendationScores: RecommendationScore[];
}
