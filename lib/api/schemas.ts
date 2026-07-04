import { z } from "zod";
import { COUNTRIES, TOPICS } from "@/lib/constants";

const topicIds = TOPICS.map((topic) => topic.id) as [string, ...string[]];
const countryIds = COUNTRIES.map((country) => country.id) as [string, ...string[]];

export const interactionBodySchema = z.object({
  articleId: z.string().min(1),
  action: z.enum(["click", "save", "like", "dislike", "hide_source", "mute_topic"]),
  sessionId: z.string().optional(),
  rankAtTime: z.number().optional()
});

export const preferencesBodySchema = z.object({
  selectedTopics: z.array(z.enum(topicIds)).optional(),
  selectedCountries: z.array(z.enum(countryIds)).optional(),
  mutedTopics: z.array(z.enum(topicIds)).optional(),
  hiddenSources: z.array(z.string()).optional()
});

export const feedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  cursor: z.string().optional()
});

export const relatedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(12).optional()
});

export const savedBodySchema = z.object({
  articleId: z.string().min(1),
  rankAtTime: z.number().optional()
});
