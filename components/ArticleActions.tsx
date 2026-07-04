"use client";

import { useState } from "react";
import { Bookmark, EyeOff, ThumbsDown, ThumbsUp, VolumeX } from "lucide-react";
import type { InteractionAction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch, useCsrfToken } from "@/components/providers/CsrfProvider";

interface ArticleActionsProps {
  articleId: string;
  rank: number;
  onActionComplete?: () => void;
}

export function ArticleActions({ articleId, rank, onActionComplete }: ArticleActionsProps) {
  const csrfToken = useCsrfToken();
  const [pending, setPending] = useState<string | null>(null);

  async function interact(action: InteractionAction) {
    setPending(action);
    try {
      await apiFetch(
        "/api/interactions",
        {
          method: "POST",
          body: JSON.stringify({ articleId, action, rankAtTime: rank })
        },
        csrfToken
      );
      if (action === "dislike" || action === "hide_source" || action === "mute_topic") {
        onActionComplete?.();
      }
    } finally {
      setPending(null);
    }
  }

  const actions: { action: InteractionAction; label: string; icon: React.ReactNode }[] = [
    { action: "like", label: "More like this", icon: <ThumbsUp className="h-4 w-4" /> },
    { action: "dislike", label: "Less like this", icon: <ThumbsDown className="h-4 w-4" /> },
    { action: "save", label: "Save article", icon: <Bookmark className="h-4 w-4" /> },
    { action: "hide_source", label: "Hide source", icon: <EyeOff className="h-4 w-4" /> },
    { action: "mute_topic", label: "Mute topic", icon: <VolumeX className="h-4 w-4" /> }
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ action, label, icon }) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={pending === action}
                aria-label={label}
                onClick={() => interact(action)}
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
