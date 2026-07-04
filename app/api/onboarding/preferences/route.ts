import { NextResponse } from "next/server";
import { preferencesBodySchema } from "@/lib/api/schemas";
import { ensureUserProfile } from "@/lib/auth/session";
import { withGuards } from "@/lib/http/withGuards";
import type { CountryCode, Topic, UserProfile } from "@/lib/types";
import { getProfile, upsertProfile } from "@/lib/storage/store";

export const runtime = "nodejs";

export const POST = withGuards(
  async (request, { userId }) => {
    const body = preferencesBodySchema.parse(await request.json());
    const now = new Date().toISOString();
    const existing = await getProfile(userId!);
    const profile: UserProfile = {
      ...(existing ?? (await ensureUserProfile(userId!))),
      selectedTopics: (body.selectedTopics as Topic[] | undefined) ?? existing?.selectedTopics ?? ["AI", "Climate"],
      selectedCountries:
        (body.selectedCountries as CountryCode[] | undefined) ?? existing?.selectedCountries ?? ["US", "GLOBAL"],
      onboardedAt: existing?.onboardedAt ?? now,
      lastActiveAt: now
    };
    await upsertProfile(profile);
    return NextResponse.json({ profile }, { status: 201 });
  },
  { bodySchema: preferencesBodySchema }
);
