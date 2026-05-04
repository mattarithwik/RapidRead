import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import type { Article, Sentiment, Topic } from "@/lib/types";
import { listArticles, updateArticle } from "@/lib/storage/localStore";
import { classifyTopics } from "@/lib/news/topicClassifier";

interface TextEnrichment {
  summary: string;
  topics: Topic[];
  entities: string[];
  sentiment: Sentiment;
}

const textModelId = process.env.BEDROCK_TEXT_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0";
const embeddingModelId = process.env.BEDROCK_EMBEDDING_MODEL_ID ?? "amazon.titan-embed-text-v2:0";

function fallbackEmbedding(text: string): number[] {
  const buckets = new Array(8).fill(0);
  for (let index = 0; index < text.length; index += 1) {
    buckets[index % buckets.length] += text.charCodeAt(index) / 255;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((value) => Number((value / max).toFixed(4)));
}

function fallbackEnrichment(article: Article): TextEnrichment {
  const text = `${article.title}. ${article.excerpt}`;
  return {
    summary: article.excerpt || article.title,
    topics: classifyTopics(text, article.topics[0] ?? "Technology"),
    entities: article.entities,
    sentiment: article.sentiment || "neutral"
  };
}

async function invokeTextEnrichment(client: BedrockRuntimeClient, article: Article): Promise<TextEnrichment> {
  const prompt = [
    "Return only valid JSON with this shape:",
    '{"summary":"string","topics":["AI"],"entities":["string"],"sentiment":"positive|neutral|negative|mixed"}.',
    "Use at most three topics from: AI, Climate, Business, Health, Science, Politics, Technology, Sports.",
    `Title: ${article.title}`,
    `Excerpt: ${article.excerpt}`
  ].join("\n");

  const command = new InvokeModelCommand({
    modelId: textModelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
    })
  });
  const response = await client.send(command);
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  const text = decoded.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as TextEnrichment;
}

async function invokeEmbedding(client: BedrockRuntimeClient, article: Article): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: embeddingModelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: `${article.title}\n${article.summary ?? article.excerpt}` })
  });
  const response = await client.send(command);
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  return decoded.embedding as number[];
}

export async function enrichArticle(article: Article): Promise<Article> {
  const useBedrock = process.env.ENABLE_BEDROCK === "true";
  const nextAttempts = article.enrichmentAttempts + 1;
  try {
    const client = useBedrock ? new BedrockRuntimeClient({}) : undefined;
    const text = client ? await invokeTextEnrichment(client, article) : fallbackEnrichment(article);
    const enriched: Article = {
      ...article,
      summary: text.summary,
      topics: text.topics,
      entities: text.entities,
      sentiment: text.sentiment,
      embedding: client ? await invokeEmbedding(client, { ...article, summary: text.summary }) : fallbackEmbedding(`${article.title} ${text.summary}`),
      enriched: true,
      enrichedAt: new Date().toISOString(),
      enrichmentAttempts: nextAttempts,
      enrichedFailed: false
    };
    await updateArticle(enriched);
    return enriched;
  } catch {
    const failed: Article = {
      ...article,
      enrichmentAttempts: nextAttempts,
      enrichedFailed: nextAttempts >= 3
    };
    await updateArticle(failed);
    return failed;
  }
}

export async function enrichPendingArticles(limit = 50) {
  const candidates = (await listArticles())
    .filter((article) => !article.enriched && !article.enrichedFailed)
    .filter((article) => article.enrichmentAttempts < 3)
    .slice(0, limit);
  const enriched = [];
  for (const article of candidates) {
    enriched.push(await enrichArticle(article));
  }
  return { attempted: candidates.length, enriched: enriched.filter((article) => article.enriched).length };
}
