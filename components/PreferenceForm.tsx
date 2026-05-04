"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { COUNTRIES, TOPICS } from "@/lib/constants";
import type { CountryCode, Topic, UserProfile } from "@/lib/types";

interface PreferenceFormProps {
  profile?: UserProfile;
  mode: "onboarding" | "settings";
}

export function PreferenceForm({ profile, mode }: PreferenceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topics, setTopics] = useState<Topic[]>(profile?.selectedTopics ?? ["AI", "Climate"]);
  const [countries, setCountries] = useState<CountryCode[]>(
    profile?.selectedCountries ?? ["US", "GLOBAL"]
  );

  function toggleTopic(topic: Topic) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  }

  function toggleCountry(country: CountryCode) {
    setCountries((current) =>
      current.includes(country)
        ? current.filter((item) => item !== country)
        : [...current, country]
    );
  }

  function submit() {
    startTransition(async () => {
      const endpoint =
        mode === "onboarding" ? "/api/onboarding/preferences" : "/api/settings/preferences";
      const method = mode === "onboarding" ? "POST" : "PATCH";
      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTopics: topics, selectedCountries: countries })
      });
      router.refresh();
      router.push("/");
    });
  }

  return (
    <section className="form-panel">
      <div className="form-grid">
        <div>
          <h2>Topics</h2>
          <div className="option-grid">
            {TOPICS.map((topic) => (
              <label key={topic.id} className="option">
                <input
                  type="checkbox"
                  checked={topics.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                />
                {topic.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <h2>Countries</h2>
          <div className="option-grid">
            {COUNTRIES.map((country) => (
              <label key={country.id} className="option">
                <input
                  type="checkbox"
                  checked={countries.includes(country.id)}
                  onChange={() => toggleCountry(country.id)}
                />
                {country.label}
              </label>
            ))}
          </div>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={submit}
          disabled={pending || !topics.length || !countries.length}
        >
          <Save size={17} />
          {pending ? "Saving" : mode === "onboarding" ? "Build my feed" : "Save preferences"}
        </button>
      </div>
    </section>
  );
}
