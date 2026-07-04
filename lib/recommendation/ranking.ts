import type { ArticleQueryOptions } from "@/lib/storage/types";
import { countryLabel } from "@/lib/constants";
import type {
  Article,
  Interaction,
  InteractionAction,
  RankedArticle,
  SignalBreakdown,
  Topic,
  UserProfile
} from "@/lib/types";
import { averageVectors, clamp01, cosineSimilarity, weightedAverageVectors } from "@/lib/recommendation/math";

const SIX_HOURS_SECONDS = 6 * 60 * 60;
const RECENT_CLICK_WINDOW_MS = 2 * 60 * 60 * 1000;
const RECENT_CLICK_LIMIT = 10;

const INTERACTION_WEIGHTS: Partial<Record<InteractionAction, number>> = {
  like: 1,
  save: 1,
  click: 0.3
};

export function computeUserCentroid(
  interactions: Interaction[],
  articles: Article[]
): number[] | undefined {
  const articleById = new Map(articles.map((article) => [article.articleId, article]));
  const weightedVectors: { vector: number[]; weight: number }[] = [];

  for (const interaction of interactions) {
    const weight = INTERACTION_WEIGHTS[interaction.action];
    if (!weight) continue;
    const article = articleById.get(interaction.articleId);
    if (!article?.embedding?.length) continue;
    weightedVectors.push({ vector: article.embedding, weight });
  }

  return weightedAverageVectors(weightedVectors);
}

function computeRecentClickCentroid(
  interactions: Interaction[],
  articles: Article[],
  now: Date
): number[] | undefined {
  const articleById = new Map(articles.map((article) => [article.articleId, article]));
  const cutoff = now.getTime() - RECENT_CLICK_WINDOW_MS;
  const recentClicks = interactions
    .filter(
      (interaction) =>
        interaction.action === "click" && Date.parse(interaction.timestamp) >= cutoff
    )
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, RECENT_CLICK_LIMIT);

  const vectors = recentClicks
    .map((interaction) => articleById.get(interaction.articleId)?.embedding)
    .filter((embedding): embedding is number[] => Boolean(embedding?.length));

  return averageVectors(vectors);
}

function topicMatch(article: Article, profile: UserProfile, inferredTopics: Topic[]): number {
  const wanted = new Set([...profile.selectedTopics, ...inferredTopics]);
  if (!wanted.size) return 0;
  const matches = article.topics.filter((topic) => wanted.has(topic)).length;
  return clamp01(matches / Math.min(article.topics.length || 1, wanted.size));
}

function countryMatch(article: Article, profile: UserProfile): number {
  if (profile.selectedCountries.includes(article.sourceCountry)) return 1;
  if (article.sourceCountry === "GLOBAL") return 0.65;
  return 0;
}

function recencyScore(article: Article, now: Date): number {
  const ageHours = Math.max(0, (now.getTime() - Date.parse(article.publishedAt)) / 3_600_000);
  return Math.pow(0.5, ageHours / 12);
}

function popularityScore(article: Article, allInteractions: Interaction[], now: Date): number {
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const count = allInteractions.filter(
    (interaction) =>
      interaction.articleId === article.articleId &&
      Date.parse(interaction.timestamp) >= oneDayAgo &&
      ["click", "save", "like"].includes(interaction.action)
  ).length;
  return clamp01(Math.log1p(count) / Math.log1p(20));
}

function feedbackScore(
  article: Article,
  userInteractions: Interaction[],
  articles: Article[],
  profile: UserProfile
): { score: number; filteredReason?: string } {
  if (profile.hiddenSources.includes(article.sourceId)) {
    return { score: 0, filteredReason: "hidden_source" };
  }
  if (article.topics.some((topic) => profile.mutedTopics.includes(topic))) {
    return { score: 0, filteredReason: "muted_topic" };
  }
  const directActions = userInteractions
    .filter((interaction) => interaction.articleId === article.articleId)
    .map((interaction) => interaction.action);
  if (directActions.includes("dislike")) return { score: 0, filteredReason: "disliked" };
  if (directActions.includes("save") || directActions.includes("like")) return { score: 1 };

  const positiveTopicSet = new Set<Topic>();
  const articleById = new Map(articles.map((item) => [item.articleId, item]));
  for (const interaction of userInteractions) {
    if (interaction.action !== "like" && interaction.action !== "save") continue;
    const likedArticle = articleById.get(interaction.articleId);
    likedArticle?.topics.forEach((topic) => positiveTopicSet.add(topic));
  }
  const overlap = article.topics.filter((topic) => positiveTopicSet.has(topic)).length;
  return { score: overlap ? 0.75 : 0.5 };
}

function inferTopics(interactions: Interaction[], articles: Article[]): Topic[] {
  const counts = new Map<Topic, number>();
  const positiveArticleIds = new Set(
    interactions
      .filter((interaction) => interaction.action === "like" || interaction.action === "save")
      .map((interaction) => interaction.articleId)
  );
  for (const article of articles) {
    if (!positiveArticleIds.has(article.articleId)) continue;
    for (const topic of article.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

function buildExplanation(article: Article, profile: UserProfile, signals: SignalBreakdown): string {
  const reasons = [
    { key: "topicMatch", value: signals.topicMatch },
    { key: "countryMatch", value: signals.countryMatch },
    { key: "semanticSimilarity", value: signals.semanticSimilarity },
    { key: "recentClickAffinity", value: signals.recentClickAffinity },
    { key: "recency", value: signals.recency }
  ].sort((a, b) => b.value - a.value);
  const top = reasons[0]?.key;

  if (top === "recentClickAffinity" && signals.recentClickAffinity > 0.65) {
    return "Recommended because it matches stories you recently opened.";
  }
  if (top === "countryMatch" && signals.countryMatch > 0) {
    return `Recommended because it matches your ${countryLabel(article.sourceCountry)} news preference.`;
  }
  if (top === "semanticSimilarity" && signals.semanticSimilarity > 0.65) {
    return "Recommended because it is similar to stories you saved or liked.";
  }
  const matchedTopic = article.topics.find((topic) => profile.selectedTopics.includes(topic));
  if (matchedTopic) {
    const country = signals.countryMatch > 0 ? ` and your ${countryLabel(article.sourceCountry)} news preference` : "";
    return `Recommended because it matches your ${matchedTopic} interest${country}.`;
  }
  return "Recommended because it is recent and broadens your source mix.";
}

function blendScore(signals: SignalBreakdown): number {
  if (signals.filteredReason) return 0;
  if (signals.coldStart) {
    return (
      0.45 * signals.topicMatch +
      0.35 * signals.countryMatch +
      0.15 * signals.recency +
      0.05 * signals.sourceDiversity
    );
  }
  return (
    0.27 * signals.topicMatch +
    0.18 * signals.semanticSimilarity +
    0.1 * signals.recentClickAffinity +
    0.14 * signals.countryMatch +
    0.14 * signals.recency +
    0.09 * signals.feedback +
    0.05 * signals.sourceDiversity +
    0.03 * signals.popularity
  );
}

export function rankArticles(params: {
  articles: Article[];
  profile: UserProfile;
  userInteractions: Interaction[];
  allInteractions: Interaction[];
  now?: Date;
  limit?: number;
  offset?: number;
}): RankedArticle[] {
  const now = params.now ?? new Date();
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const userInteractions = params.userInteractions
    .filter((interaction) => Date.parse(interaction.timestamp) >= thirtyDaysAgo)
    .slice(-500);
  const userInteractionCount = userInteractions.length;
  const coldStart = userInteractionCount < 5;
  const centroid = coldStart ? undefined : computeUserCentroid(userInteractions, params.articles);
  const recentClickCentroid = coldStart
    ? undefined
    : computeRecentClickCentroid(userInteractions, params.articles, now);
  const inferredTopics = inferTopics(userInteractions, params.articles);

  const baseRanked = params.articles
    .filter((article) => !article.enrichedFailed)
    .map((article) => {
      const feedback = feedbackScore(article, userInteractions, params.articles, params.profile);
      const signals: SignalBreakdown = {
        topicMatch: topicMatch(article, params.profile, inferredTopics),
        semanticSimilarity: coldStart ? 0 : cosineSimilarity(article.embedding, centroid),
        recentClickAffinity: coldStart
          ? 0
          : cosineSimilarity(article.embedding, recentClickCentroid),
        countryMatch: countryMatch(article, params.profile),
        recency: recencyScore(article, now),
        feedback: feedback.score,
        sourceDiversity: 1,
        popularity: popularityScore(article, params.allInteractions, now),
        coldStart,
        filteredReason: feedback.filteredReason
      };
      return { article, signals, finalScore: blendScore(signals) };
    })
    .filter((item) => item.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore);

  const seenSources = new Map<string, number>();
  const diversified = baseRanked.map((item, index) => {
    const sourceCount = seenSources.get(item.article.sourceId) ?? 0;
    const sourceDiversity = index < 5 && sourceCount > 0 ? 0.3 : 1;
    seenSources.set(item.article.sourceId, sourceCount + 1);
    const signals = { ...item.signals, sourceDiversity };
    const finalScore = blendScore(signals);
    return {
      ...item.article,
      finalScore,
      signalBreakdown: signals,
      explanation: buildExplanation(item.article, params.profile, signals)
    };
  });

  const sorted = diversified.sort((a, b) => b.finalScore - a.finalScore);
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 20;
  return sorted.slice(offset, offset + limit);
}

export function rankRelatedArticles(params: {
  source: Article;
  candidates: Article[];
  profile: UserProfile;
  userInteractions: Interaction[];
  limit?: number;
}): RankedArticle[] {
  const now = new Date();
  const filtered = params.candidates.filter(
    (article) =>
      article.articleId !== params.source.articleId &&
      article.enriched &&
      !article.enrichedFailed
  );

  return filtered
    .map((article) => {
      const feedback = feedbackScore(
        article,
        params.userInteractions,
        params.candidates,
        params.profile
      );
      const similarity = cosineSimilarity(article.embedding, params.source.embedding);
      const signals: SignalBreakdown = {
        topicMatch: topicMatch(article, params.profile, params.source.topics),
        semanticSimilarity: similarity,
        recentClickAffinity: similarity,
        countryMatch: countryMatch(article, params.profile),
        recency: recencyScore(article, now),
        feedback: feedback.score,
        sourceDiversity: article.sourceId === params.source.sourceId ? 0.5 : 1,
        popularity: 0,
        coldStart: false,
        filteredReason: feedback.filteredReason
      };
      const finalScore = feedback.filteredReason
        ? 0
        : 0.55 * similarity + 0.2 * signals.topicMatch + 0.15 * signals.recency + 0.1 * signals.sourceDiversity;
      return {
        ...article,
        finalScore,
        signalBreakdown: signals,
        explanation: `Similar to "${params.source.title}" based on topic overlap and semantic match.`
      };
    })
    .filter((item) => item.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, params.limit ?? 6);
}

export function toRecommendationScore(userId: string, article: RankedArticle) {
  const generatedAt = new Date().toISOString();
  return {
    userId,
    articleId: article.articleId,
    finalScore: article.finalScore,
    signalBreakdown: article.signalBreakdown,
    explanation: article.explanation,
    generatedAt,
    ttl: Math.floor(Date.now() / 1000) + SIX_HOURS_SECONDS
  };
}

export function summarizeInferredInterests(interactions: Interaction[], articles: Article[]) {
  return inferTopics(interactions, articles).map((topic) => ({
    topic,
    count: articles.filter(
      (article) =>
        article.topics.includes(topic) &&
        interactions.some(
          (interaction) =>
            interaction.articleId === article.articleId &&
            (interaction.action === "like" || interaction.action === "save")
        )
    ).length
  }));
}
