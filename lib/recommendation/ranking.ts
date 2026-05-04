import { countryLabel } from "@/lib/constants";
import type {
  Article,
  Interaction,
  RankedArticle,
  SignalBreakdown,
  Topic,
  UserProfile
} from "@/lib/types";
import { averageVectors, clamp01, cosineSimilarity } from "@/lib/recommendation/math";

const SIX_HOURS_SECONDS = 6 * 60 * 60;

export function computeUserCentroid(
  interactions: Interaction[],
  articles: Article[]
): number[] | undefined {
  const positiveArticleIds = new Set(
    interactions
      .filter((interaction) => interaction.action === "like" || interaction.action === "save")
      .map((interaction) => interaction.articleId)
  );
  const vectors = articles
    .filter((article) => positiveArticleIds.has(article.articleId) && article.embedding?.length)
    .map((article) => article.embedding as number[]);
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
  for (const interaction of userInteractions) {
    if (interaction.action !== "like" && interaction.action !== "save") continue;
    // Related article topic boosts are applied by caller through inferred topics.
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
    { key: "recency", value: signals.recency }
  ].sort((a, b) => b.value - a.value);
  const top = reasons[0]?.key;

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

export function rankArticles(params: {
  articles: Article[];
  profile: UserProfile;
  userInteractions: Interaction[];
  allInteractions: Interaction[];
  now?: Date;
  limit?: number;
}): RankedArticle[] {
  const now = params.now ?? new Date();
  const userInteractionCount = params.userInteractions.length;
  const coldStart = userInteractionCount < 5;
  const centroid = coldStart
    ? undefined
    : computeUserCentroid(params.userInteractions, params.articles);
  const inferredTopics = inferTopics(params.userInteractions, params.articles);

  const baseRanked = params.articles
    .filter((article) => !article.enrichedFailed)
    .map((article) => {
      const feedback = feedbackScore(article, params.userInteractions, params.profile);
      const signals: SignalBreakdown = {
        topicMatch: topicMatch(article, params.profile, inferredTopics),
        semanticSimilarity: coldStart ? 0 : cosineSimilarity(article.embedding, centroid),
        countryMatch: countryMatch(article, params.profile),
        recency: recencyScore(article, now),
        feedback: feedback.score,
        sourceDiversity: 1,
        popularity: popularityScore(article, params.allInteractions, now),
        coldStart,
        filteredReason: feedback.filteredReason
      };
      const finalScore = feedback.filteredReason
        ? 0
        : coldStart
          ? 0.45 * signals.topicMatch +
            0.35 * signals.countryMatch +
            0.15 * signals.recency +
            0.05 * signals.sourceDiversity
          : 0.3 * signals.topicMatch +
            0.2 * signals.semanticSimilarity +
            0.15 * signals.countryMatch +
            0.15 * signals.recency +
            0.1 * signals.feedback +
            0.05 * signals.sourceDiversity +
            0.05 * signals.popularity;
      return { article, signals, finalScore };
    })
    .filter((item) => item.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore);

  const seenSources = new Map<string, number>();
  const diversified = baseRanked.map((item, index) => {
    const sourceCount = seenSources.get(item.article.sourceId) ?? 0;
    const sourceDiversity = index < 5 && sourceCount > 0 ? 0.3 : 1;
    seenSources.set(item.article.sourceId, sourceCount + 1);
    const signals = { ...item.signals, sourceDiversity };
    const finalScore = signals.coldStart
      ? 0.45 * signals.topicMatch +
        0.35 * signals.countryMatch +
        0.15 * signals.recency +
        0.05 * signals.sourceDiversity
      : 0.3 * signals.topicMatch +
        0.2 * signals.semanticSimilarity +
        0.15 * signals.countryMatch +
        0.15 * signals.recency +
        0.1 * signals.feedback +
        0.05 * signals.sourceDiversity +
        0.05 * signals.popularity;
    return {
      ...item.article,
      finalScore,
      signalBreakdown: signals,
      explanation: buildExplanation(item.article, params.profile, signals)
    };
  });

  return diversified.sort((a, b) => b.finalScore - a.finalScore).slice(0, params.limit ?? 20);
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
