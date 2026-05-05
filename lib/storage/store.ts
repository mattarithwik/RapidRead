import { dynamoStore } from "@/lib/storage/dynamoStore";
import { localStore } from "@/lib/storage/localStore";
import type { NewsStore } from "@/lib/storage/types";

export function getStore(): NewsStore {
  return process.env.STORAGE_BACKEND === "aws" ? dynamoStore : localStore;
}

export const readStore = () => getStore().readStore();
export const writeStore: NewsStore["writeStore"] = (...args) => getStore().writeStore(...args);
export const resetStore: NewsStore["resetStore"] = (...args) => getStore().resetStore(...args);
export const listArticles = () => getStore().listArticles();
export const getArticle: NewsStore["getArticle"] = (...args) => getStore().getArticle(...args);
export const upsertArticles: NewsStore["upsertArticles"] = (...args) =>
  getStore().upsertArticles(...args);
export const updateArticle: NewsStore["updateArticle"] = (...args) =>
  getStore().updateArticle(...args);
export const getProfile: NewsStore["getProfile"] = (...args) => getStore().getProfile(...args);
export const upsertProfile: NewsStore["upsertProfile"] = (...args) =>
  getStore().upsertProfile(...args);
export const listInteractions: NewsStore["listInteractions"] = (...args) =>
  getStore().listInteractions(...args);
export const addInteraction: NewsStore["addInteraction"] = (...args) =>
  getStore().addInteraction(...args);
export const upsertRecommendationScores: NewsStore["upsertRecommendationScores"] = (...args) =>
  getStore().upsertRecommendationScores(...args);
