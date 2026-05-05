import { NextResponse } from "next/server";
import { COUNTRIES, TOPICS } from "@/lib/constants";
import type { CountryCode, Topic } from "@/lib/types";
import { profileFallback } from "@/lib/seed";
import { getProfile, upsertProfile } from "@/lib/storage/store";
import { getDemoUserId } from "@/lib/user";

export const runtime = "nodejs";

const topicIds = new Set(TOPICS.map((topic) => topic.id));
const countryIds = new Set(COUNTRIES.map((country) => country.id));

function pickTopics(input: unknown, fallback: Topic[]): Topic[] {
  return Array.isArray(input) ? input.filter((item): item is Topic => topicIds.has(item)) : fallback;
}

function pickCountries(input: unknown, fallback: CountryCode[]): CountryCode[] {
  return Array.isArray(input)
    ? input.filter((item): item is CountryCode => countryIds.has(item))
    : fallback;
}

export async function PATCH(request: Request) {
  const userId = await getDemoUserId();
  const existing = await getProfile(userId);
  const body = await request.json();
  const base = existing ?? profileFallback(userId);
  const profile = {
    ...base,
    selectedTopics: pickTopics(body.selectedTopics, base.selectedTopics),
    selectedCountries: pickCountries(body.selectedCountries, base.selectedCountries),
    mutedTopics: pickTopics(body.mutedTopics, base.mutedTopics),
    hiddenSources: Array.isArray(body.hiddenSources)
      ? body.hiddenSources.filter((item: unknown): item is string => typeof item === "string")
      : base.hiddenSources,
    onboardedAt: base.onboardedAt ?? new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  await upsertProfile(profile);
  return NextResponse.json({ profile });
}
