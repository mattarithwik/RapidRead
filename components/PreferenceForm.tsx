"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { TOPICS } from "@/lib/constants";
import type { CountryCode, Topic, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountryPicker } from "@/components/preferences/CountryPicker";
import { apiFetch, useCsrfToken } from "@/components/providers/CsrfProvider";

interface PreferenceFormProps {
  profile?: UserProfile;
  mode: "onboarding" | "settings";
}

export function PreferenceForm({ profile, mode }: PreferenceFormProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(mode === "onboarding");
  const [topics, setTopics] = useState<Topic[]>(profile?.selectedTopics ?? ["AI", "Climate"]);
  const [countries, setCountries] = useState<CountryCode[]>(
    profile?.selectedCountries ?? ["US", "GLOBAL"]
  );

  function toggleTopic(topic: Topic) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  }

  function submit() {
    startTransition(async () => {
      const endpoint =
        mode === "onboarding" ? "/api/onboarding/preferences" : "/api/settings/preferences";
      const method = mode === "onboarding" ? "POST" : "PATCH";
      await apiFetch(
        endpoint,
        {
          method,
          body: JSON.stringify({ selectedTopics: topics, selectedCountries: countries })
        },
        csrfToken
      );
      setOpen(false);
      router.refresh();
      router.push("/");
    });
  }

  const countryStep = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Search and select the countries and regions you want in your brief.
      </p>
      <CountryPicker value={countries} onChange={setCountries} />
    </div>
  );

  const topicStep = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose the topics you want in your brief.</p>
      <div className="max-h-56 overflow-y-auto overscroll-contain rounded-md border p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggleTopic(topic.id)}
              className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition ${
                topics.includes(topic.id)
                  ? "border-primary bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {step === 0 ? topicStep : countryStep}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(0)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step === 0 ? (
          <Button onClick={() => setStep(1)} disabled={!topics.length}>
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending || !topics.length || !countries.length}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Saving" : mode === "onboarding" ? "Build my feed" : "Save preferences"}
          </Button>
        )}
      </div>
    </div>
  );

  if (mode === "onboarding") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to RapidRead</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Topics</h2>
          {topicStep}
        </div>
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Countries</h2>
          {countryStep}
        </div>
        <Button onClick={submit} disabled={pending || !topics.length || !countries.length}>
          <Save className="mr-2 h-4 w-4" />
          {pending ? "Saving" : "Save preferences"}
        </Button>
      </div>
    </div>
  );
}
