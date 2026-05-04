import type { Topic } from "@/lib/types";

const KEYWORDS: Record<Topic, string[]> = {
  AI: ["ai", "artificial intelligence", "model", "machine learning", "algorithm"],
  Climate: ["climate", "carbon", "energy", "wind", "solar", "emissions", "flood"],
  Business: ["market", "business", "startup", "company", "finance", "economy", "investment"],
  Health: ["health", "hospital", "clinical", "patient", "medicine", "disease"],
  Science: ["science", "research", "space", "battery", "physics", "biology"],
  Politics: ["policy", "government", "election", "minister", "law", "regulation"],
  Technology: ["technology", "software", "semiconductor", "chip", "cyber", "device"],
  Sports: ["sports", "league", "match", "team", "player", "tournament"]
};

export function classifyTopics(text: string, fallback: Topic): Topic[] {
  const lower = text.toLowerCase();
  const scored = Object.entries(KEYWORDS)
    .map(([topic, words]) => ({
      topic: topic as Topic,
      score: words.filter((word) => lower.includes(word)).length
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.topic);
  return scored.length ? scored : [fallback];
}
