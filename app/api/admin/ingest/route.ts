import { NextResponse } from "next/server";
import { ingestAllFeeds } from "@/lib/news/ingest";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_INGEST_ENABLED === "false") {
    return NextResponse.json({ error: "Admin ingest disabled" }, { status: 403 });
  }
  const result = await ingestAllFeeds();
  return NextResponse.json(result);
}
