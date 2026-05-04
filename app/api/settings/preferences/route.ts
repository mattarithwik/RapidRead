import { NextResponse } from "next/server";
import { COUNTRIES, TOPICS } from "@/lib/constants";
import type { CountryCode, Topic } from "@/lib/types";
import { getProfile, upsertProfile } from "@/lib/storage/localStore";
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
  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const body = await request.json();
  const profile = {
    ...existing,
    selectedTopics: pickTopics(body.selectedTopics, existing.selectedTopics),
    selectedCountries: pickCountries(body.selectedCountries, existing.selectedCountries),
    mutedTopics: pickTopics(body.mutedTopics, existing.mutedTopics),
    hiddenSources: Array.isArray(body.hiddenSources)
      ? body.hiddenSources.filter((item: unknown): item is string => typeof item === "string")
      : existing.hiddenSources,
    lastActiveAt: new Date().toISOString()
  };
  await upsertProfile(profile);
  return NextResponse.json({ profile });
}
