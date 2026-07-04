import { NextResponse } from "next/server";
import { savedBodySchema } from "@/lib/api/schemas";
import { withGuards } from "@/lib/http/withGuards";
import { addInteraction, getArticle } from "@/lib/storage/store";

export const runtime = "nodejs";

export const POST = withGuards(
  async (request, { userId }) => {
    const body = savedBodySchema.parse(await request.json());
    const article = await getArticle(body.articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    await addInteraction({
      userId: userId!,
      articleId: body.articleId,
      action: "save",
      sessionId: "web-session",
      rankAtTime: body.rankAtTime,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ ok: true });
  },
  { bodySchema: savedBodySchema }
);
