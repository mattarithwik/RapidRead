import { dynamoStore } from "@/lib/storage/dynamoStore";
import { localStore } from "@/lib/storage/localStore";
import type { NewsStore } from "@/lib/storage/types";

export function getStore(): NewsStore {
  const backend = process.env.STORAGE_BACKEND ?? "local";
  if (backend === "aws") {
    if (!process.env.NEWS_TABLE_NAME) {
      throw new Error("NEWS_TABLE_NAME is required when STORAGE_BACKEND=aws.");
    }
    return dynamoStore;
  }
  return localStore;
}

export const readStore = () => getStore().readStore();
export const writeStore: NewsStore["writeStore"] = (...args) => getStore().writeStore(...args);
export const resetStore: NewsStore["resetStore"] = (...args) => getStore().resetStore(...args);
export const listArticles = () => getStore().listArticles();
export const queryRecentArticles: NewsStore["queryRecentArticles"] = (...args) =>
  getStore().queryRecentArticles(...args);
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
export const deleteUserData: NewsStore["deleteUserData"] = (...args) =>
  getStore().deleteUserData(...args);
export const exportUserData: NewsStore["exportUserData"] = (...args) =>
  getStore().exportUserData(...args);
