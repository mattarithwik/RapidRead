import type { Topic } from "@/lib/types";

const KEYWORDS: Record<Topic, string[]> = {
  AI: ["ai", "artificial intelligence", "model", "machine learning", "algorithm", "llm", "gpt"],
  Climate: ["climate", "carbon", "emissions", "warming", "flood", "drought"],
  Environment: ["environment", "wildlife", "conservation", "pollution", "biodiversity", "ecosystem"],
  Energy: ["energy", "wind", "solar", "nuclear", "oil", "gas", "grid", "renewable"],
  Business: ["market", "business", "startup", "company", "economy", "trade", "merger"],
  Finance: ["finance", "bank", "investment", "stock", "bond", "inflation", "interest rate", "fund"],
  Health: ["health", "hospital", "clinical", "patient", "medicine", "disease", "vaccine"],
  Science: ["science", "research", "space", "physics", "biology", "study", "discovery"],
  Politics: ["policy", "government", "election", "minister", "law", "regulation", "parliament"],
  Technology: ["technology", "software", "semiconductor", "chip", "device", "digital"],
  Cybersecurity: ["cyber", "security", "hack", "breach", "malware", "ransomware", "phishing"],
  Sports: ["sports", "league", "match", "team", "player", "tournament", "championship"],
  Entertainment: ["film", "movie", "music", "celebrity", "television", "streaming", "culture"],
  Education: ["education", "school", "university", "student", "teacher", "campus", "learning"]
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
