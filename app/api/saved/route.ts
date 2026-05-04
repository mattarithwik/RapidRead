import { NextResponse } from "next/server";
import { addInteraction, getArticle } from "@/lib/storage/localStore";
import { getDemoUserId } from "@/lib/user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  if (typeof body.articleId !== "string") {
    return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
  }
  const article = await getArticle(body.articleId);
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  await addInteraction({
    userId: await getDemoUserId(),
    articleId: body.articleId,
    action: "save",
    sessionId: "demo-session",
    rankAtTime: typeof body.rankAtTime === "number" ? body.rankAtTime : undefined,
    timestamp: new Date().toISOString()
  });
  return NextResponse.json({ ok: true });
}
