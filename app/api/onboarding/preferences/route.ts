import { NextResponse } from "next/server";
import { COUNTRIES, DEFAULT_USER_ID, TOPICS } from "@/lib/constants";
import type { CountryCode, Topic, UserProfile } from "@/lib/types";
import { createUserId, DEMO_USER_COOKIE } from "@/lib/user";
import { getProfile, upsertProfile } from "@/lib/storage/localStore";

export const runtime = "nodejs";

const topicIds = new Set(TOPICS.map((topic) => topic.id));
const countryIds = new Set(COUNTRIES.map((country) => country.id));

function validTopics(input: unknown): Topic[] {
  return Array.isArray(input) ? input.filter((item): item is Topic => topicIds.has(item)) : [];
}

function validCountries(input: unknown): CountryCode[] {
  return Array.isArray(input)
    ? input.filter((item): item is CountryCode => countryIds.has(item))
    : [];
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : createUserId();
  const now = new Date().toISOString();
  const existing = await getProfile(userId);
  const profile: UserProfile = {
    userId,
    selectedTopics: validTopics(body.selectedTopics),
    selectedCountries: validCountries(body.selectedCountries),
    followedEntities: existing?.followedEntities ?? [],
    mutedTopics: existing?.mutedTopics ?? [],
    hiddenSources: existing?.hiddenSources ?? [],
    onboardedAt: existing?.onboardedAt ?? now,
    lastActiveAt: now
  };
  if (!profile.selectedTopics.length) profile.selectedTopics = ["AI", "Climate"];
  if (!profile.selectedCountries.length) profile.selectedCountries = ["US", "GLOBAL"];
  await upsertProfile(profile);

  const response = NextResponse.json({ profile }, { status: 201 });
  response.cookies.set(DEMO_USER_COOKIE, userId || DEFAULT_USER_ID, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}
