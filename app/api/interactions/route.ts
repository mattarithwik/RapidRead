import { NextResponse } from "next/server";
import { interactionBodySchema } from "@/lib/api/schemas";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import { addInteraction, getArticle, getProfile, upsertProfile } from "@/lib/storage/store";

export const runtime = "nodejs";

export const POST = withGuards(
  async (request, { userId }) => {
    const body = interactionBodySchema.parse(await request.json());
    const article = await getArticle(body.articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    await addInteraction({
      userId: userId!,
      articleId: body.articleId,
      action: body.action,
      sessionId: body.sessionId ?? "web-session",
      rankAtTime: body.rankAtTime,
      timestamp
    });

    if (body.action === "hide_source" || body.action === "mute_topic") {
      const profile = (await getProfile(userId!)) ?? (await ensureUserProfile(userId!));
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
        lastActiveAt: timestamp,
        centroidVersion: timestamp
      });
    } else if (["like", "save", "dislike", "click"].includes(body.action)) {
      const profile = (await getProfile(userId!)) ?? (await ensureUserProfile(userId!));
      await upsertProfile({
        ...profile,
        lastActiveAt: timestamp,
        centroidVersion: timestamp
      });
    }

    return NextResponse.json({ ok: true });
  },
  { bodySchema: interactionBodySchema }
);
