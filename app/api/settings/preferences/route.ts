import { NextResponse } from "next/server";
import { preferencesBodySchema } from "@/lib/api/schemas";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import type { CountryCode, Topic } from "@/lib/types";
import { getProfile, upsertProfile } from "@/lib/storage/store";

export const runtime = "nodejs";

export const PATCH = withGuards(
  async (request, { userId }) => {
    const body = preferencesBodySchema.parse(await request.json());
    const existing = (await getProfile(userId!)) ?? (await ensureUserProfile(userId!));
    const profile = {
      ...existing,
      selectedTopics: (body.selectedTopics as Topic[] | undefined) ?? existing.selectedTopics,
      selectedCountries: (body.selectedCountries as CountryCode[] | undefined) ?? existing.selectedCountries,
      mutedTopics: (body.mutedTopics as Topic[] | undefined) ?? existing.mutedTopics,
      hiddenSources: body.hiddenSources ?? existing.hiddenSources,
      onboardedAt: existing.onboardedAt ?? new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    await upsertProfile(profile);
    return NextResponse.json({ profile });
  },
  { bodySchema: preferencesBodySchema }
);
