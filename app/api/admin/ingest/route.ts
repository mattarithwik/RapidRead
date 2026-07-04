import { NextResponse } from "next/server";
import { ingestAllFeeds } from "@/lib/news/ingest";
import { withGuards } from "@/lib/http/withGuards";
import { emitMetric } from "@/lib/log";

export const runtime = "nodejs";

export const GET = withGuards(
  async () => {
    if (process.env.ADMIN_INGEST_ENABLED === "false") {
      return NextResponse.json({ error: "Admin ingest disabled" }, { status: 403 });
    }
    const result = await ingestAllFeeds();
    emitMetric("IngestFailedFeeds", result.failedFeeds);
    return NextResponse.json(result);
  },
  { requireAdmin: true }
);
