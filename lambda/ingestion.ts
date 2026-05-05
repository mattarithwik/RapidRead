import type { Context, EventBridgeEvent } from "aws-lambda";
import { ingestAllFeeds } from "@/lib/news/ingest";

export async function handler(_: EventBridgeEvent<string, unknown>, context: Context) {
  console.log("Starting scheduled RSS ingestion", {
    awsRequestId: context.awsRequestId,
    maxArticles: process.env.INGEST_MAX_ARTICLES
  });
  const result = await ingestAllFeeds(Number(process.env.INGEST_MAX_ARTICLES ?? 200));
  console.log("Finished scheduled RSS ingestion", result);
  return result;
}
