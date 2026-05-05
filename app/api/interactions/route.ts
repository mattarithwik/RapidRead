import { NextResponse } from "next/server";
import { addInteraction, getArticle, getProfile, upsertProfile } from "@/lib/storage/store";
import { getDemoUserId } from "@/lib/user";
import type { InteractionAction } from "@/lib/types";

export const runtime = "nodejs";

const actions = new Set<InteractionAction>([
  "click",
  "save",
  "like",
  "dislike",
  "hide_source",
  "mute_topic"
]);

export async function POST(request: Request) {
  const body = await request.json();
  if (typeof body.articleId !== "string" || !actions.has(body.action)) {
    return NextResponse.json({ error: "Invalid interaction" }, { status: 400 });
  }
  const userId = await getDemoUserId();
  const article = await getArticle(body.articleId);
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const timestamp = new Date().toISOString();
  await addInteraction({
    userId,
    articleId: body.articleId,
    action: body.action,
    sessionId: typeof body.sessionId === "string" ? body.sessionId : "demo-session",
    rankAtTime: typeof body.rankAtTime === "number" ? body.rankAtTime : undefined,
    timestamp
  });

  if (body.action === "hide_source" || body.action === "mute_topic") {
    const profile = await getProfile(userId);
    if (profile) {
      await upsertProfile({
        ...profile,
        hiddenSources:
          body.action === "hide_source"
            ? Array.from(new Set([...profile.hiddenSources, article.sourceId]))
            : profile.hiddenSources,
        mutedTopics:
          body.action === "mute_topic"
            ? Array.from(new Set([...profile.mutedTopics, article.topics[0]]))
            : profile.mutedTopics,
        lastActiveAt: timestamp
      });
    }
  }

  return NextResponse.json({ ok: true });
}
