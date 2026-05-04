"use client";

import { useRouter } from "next/navigation";
import { Bookmark, EyeOff, ThumbsDown, ThumbsUp, VolumeX } from "lucide-react";
import type { InteractionAction } from "@/lib/types";

interface ArticleActionsProps {
  articleId: string;
  rank: number;
}

export function ArticleActions({ articleId, rank }: ArticleActionsProps) {
  const router = useRouter();

  async function interact(action: InteractionAction) {
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, action, rankAtTime: rank })
    });
    router.refresh();
  }

  return (
    <div className="actions">
      <button className="icon-button" title="More like this" onClick={() => interact("like")}>
        <ThumbsUp size={17} />
      </button>
      <button className="icon-button" title="Less like this" onClick={() => interact("dislike")}>
        <ThumbsDown size={17} />
      </button>
      <button className="icon-button" title="Save article" onClick={() => interact("save")}>
        <Bookmark size={17} />
      </button>
      <button className="icon-button" title="Hide source" onClick={() => interact("hide_source")}>
        <EyeOff size={17} />
      </button>
      <button className="icon-button" title="Mute topic" onClick={() => interact("mute_topic")}>
        <VolumeX size={17} />
      </button>
    </div>
  );
}
