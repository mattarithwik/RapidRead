import type { Context, EventBridgeEvent } from "aws-lambda";
import { enrichPendingArticles } from "@/lib/news/enrich";

export async function handler(_: EventBridgeEvent<string, unknown>, context: Context) {
  console.log("Starting scheduled article enrichment", {
    awsRequestId: context.awsRequestId,
    limit: process.env.ENRICHMENT_BATCH_SIZE
  });
  const result = await enrichPendingArticles(Number(process.env.ENRICHMENT_BATCH_SIZE ?? 50));
  console.log("Finished scheduled article enrichment", result);
  return result;
}
