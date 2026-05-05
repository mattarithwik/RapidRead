import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import type {
  BatchWriteCommandInput,
  QueryCommandInput,
  ScanCommandInput
} from "@aws-sdk/lib-dynamodb";
import type { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import { seedSnapshot } from "@/lib/seed";
import type {
  Article,
  Interaction,
  NewsStoreSnapshot,
  RecommendationScore,
  UserProfile
} from "@/lib/types";
import type { NewsStore } from "@/lib/storage/types";

const tableName = process.env.NEWS_TABLE_NAME;

function requireTableName(): string {
  if (!tableName) {
    throw new Error("NEWS_TABLE_NAME is required when STORAGE_BACKEND=aws.");
  }
  return tableName;
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

function articleItem(article: Article) {
  return {
    PK: `ARTICLE#${article.articleId}`,
    SK: "META",
    entityType: "ARTICLE",
    ...article
  };
}

function profileItem(profile: UserProfile) {
  return {
    PK: `USER#${profile.userId}`,
    SK: "PROFILE",
    entityType: "USER_PROFILE",
    ...profile
  };
}

function interactionItem(interaction: Interaction) {
  return {
    PK: `USER#${interaction.userId}`,
    SK: `INTERACTION#${interaction.timestamp}#${interaction.articleId}`,
    GSI1PK: `ARTICLE#${interaction.articleId}`,
    GSI1SK: `INTERACTION#${interaction.timestamp}`,
    entityType: "INTERACTION",
    ...interaction
  };
}

function scoreItem(score: RecommendationScore) {
  return {
    PK: `USER#${score.userId}`,
    SK: `SCORE#${score.articleId}`,
    entityType: "RECOMMENDATION_SCORE",
    ...score
  };
}

function stripKeys<T>(item: Record<string, unknown>): T {
  const { PK, SK, GSI1PK, GSI1SK, entityType, ...rest } = item;
  void PK;
  void SK;
  void GSI1PK;
  void GSI1SK;
  void entityType;
  return rest as T;
}

async function batchWriteAll(requestItems: BatchWriteCommandInput["RequestItems"]): Promise<void> {
  let pending = requestItems;
  do {
    const response = await client.send(new BatchWriteCommand({ RequestItems: pending }));
    pending = response.UnprocessedItems;
  } while (pending && Object.values(pending).some((items) => items.length > 0));
}

async function batchPut(items: Record<string, unknown>[]): Promise<void> {
  const table = requireTableName();
  for (let index = 0; index < items.length; index += 25) {
    const chunk = items.slice(index, index + 25);
    if (!chunk.length) continue;
    await batchWriteAll({
      [table]: chunk.map((Item) => ({ PutRequest: { Item } }))
    });
  }
}

async function batchDelete(keys: { PK: string; SK: string }[]): Promise<void> {
  const table = requireTableName();
  for (let index = 0; index < keys.length; index += 25) {
    const chunk = keys.slice(index, index + 25);
    if (!chunk.length) continue;
    await batchWriteAll({
      [table]: chunk.map((Key) => ({ DeleteRequest: { Key } }))
    });
  }
}

async function scanAll(params: Omit<ScanCommandInput, "TableName">) {
  const items: Record<string, NativeAttributeValue>[] = [];
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined;
  do {
    const response = await client.send(
      new ScanCommand({
        TableName: requireTableName(),
        ...params,
        ExclusiveStartKey
      })
    );
    items.push(...((response.Items ?? []) as Record<string, NativeAttributeValue>[]));
    ExclusiveStartKey = response.LastEvaluatedKey as Record<string, NativeAttributeValue> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

async function queryAll(params: Omit<QueryCommandInput, "TableName">) {
  const items: Record<string, NativeAttributeValue>[] = [];
  let ExclusiveStartKey: Record<string, NativeAttributeValue> | undefined;
  do {
    const response = await client.send(
      new QueryCommand({
        TableName: requireTableName(),
        ...params,
        ExclusiveStartKey
      })
    );
    items.push(...((response.Items ?? []) as Record<string, NativeAttributeValue>[]));
    ExclusiveStartKey = response.LastEvaluatedKey as Record<string, NativeAttributeValue> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

async function deleteRecommendationScoresForUser(userId: string): Promise<void> {
  const items = await queryAll({
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "SCORE#"
    },
    ProjectionExpression: "PK, SK"
  });
  await batchDelete(items.map((item) => ({ PK: item.PK as string, SK: item.SK as string })));
}

export async function listArticles(): Promise<Article[]> {
  const items = await scanAll({
    FilterExpression: "entityType = :entityType",
    ExpressionAttributeValues: { ":entityType": "ARTICLE" }
  });
  return items
    .map((item) => stripKeys<Article>(item))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function getArticle(articleId: string): Promise<Article | undefined> {
  const items = await queryAll({
    KeyConditionExpression: "PK = :pk AND SK = :sk",
    ExpressionAttributeValues: {
      ":pk": `ARTICLE#${articleId}`,
      ":sk": "META"
    },
    Limit: 1
  });
  const item = items[0];
  return item ? stripKeys<Article>(item) : undefined;
}

export async function upsertArticles(articles: Article[]): Promise<void> {
  await batchPut(articles.map(articleItem));
}

export async function updateArticle(article: Article): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: requireTableName(),
      Item: articleItem(article)
    })
  );
}

export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  const items = await queryAll({
    KeyConditionExpression: "PK = :pk AND SK = :sk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "PROFILE"
    },
    Limit: 1
  });
  const item = items[0];
  return item ? stripKeys<UserProfile>(item) : undefined;
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: requireTableName(),
      Item: profileItem(profile)
    })
  );
}

export async function listInteractions(userId?: string): Promise<Interaction[]> {
  if (userId) {
    const items = await queryAll({
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "INTERACTION#"
      }
    });
    return items.map((item) => stripKeys<Interaction>(item));
  }
  const items = await scanAll({
    FilterExpression: "entityType = :entityType",
    ExpressionAttributeValues: { ":entityType": "INTERACTION" }
  });
  return items.map((item) => stripKeys<Interaction>(item));
}

export async function addInteraction(interaction: Interaction): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: requireTableName(),
      Item: interactionItem(interaction)
    })
  );
  await deleteRecommendationScoresForUser(interaction.userId);
}

export async function upsertRecommendationScores(scores: RecommendationScore[]): Promise<void> {
  await batchPut(scores.map(scoreItem));
}

export async function readStore(): Promise<NewsStoreSnapshot> {
  const [articles, interactions, profiles, scores] = await Promise.all([
    listArticles(),
    listInteractions(),
    scanAll({
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: { ":entityType": "USER_PROFILE" }
    }),
    scanAll({
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: { ":entityType": "RECOMMENDATION_SCORE" }
    })
  ]);
  return {
    articles,
    profiles: profiles.map((item) => stripKeys<UserProfile>(item)),
    interactions,
    recommendationScores: scores.map((item) => stripKeys<RecommendationScore>(item))
  };
}

export async function writeStore(snapshot: NewsStoreSnapshot): Promise<void> {
  await batchPut([
    ...snapshot.articles.map(articleItem),
    ...snapshot.profiles.map(profileItem),
    ...snapshot.interactions.map(interactionItem),
    ...snapshot.recommendationScores.map(scoreItem)
  ]);
}

export async function resetStore(snapshot: NewsStoreSnapshot = seedSnapshot): Promise<void> {
  const current = await scanAll({ ProjectionExpression: "PK, SK" });
  await batchDelete(current.map((item) => ({ PK: item.PK as string, SK: item.SK as string })));
  await writeStore(snapshot);
}

export const dynamoStore: NewsStore = {
  readStore,
  writeStore,
  resetStore,
  listArticles,
  getArticle,
  upsertArticles,
  updateArticle,
  getProfile,
  upsertProfile,
  listInteractions,
  addInteraction,
  upsertRecommendationScores
};
