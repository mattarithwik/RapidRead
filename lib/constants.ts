import type { CountryCode, Topic } from "@/lib/types";

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "AI", label: "AI" },
  { id: "Climate", label: "Climate" },
  { id: "Business", label: "Business" },
  { id: "Health", label: "Health" },
  { id: "Science", label: "Science" },
  { id: "Politics", label: "Politics" },
  { id: "Technology", label: "Technology" },
  { id: "Sports", label: "Sports" }
];

export const COUNTRIES: { id: CountryCode; label: string }[] = [
  { id: "US", label: "United States" },
  { id: "GB", label: "United Kingdom" },
  { id: "CA", label: "Canada" },
  { id: "IN", label: "India" },
  { id: "AU", label: "Australia" },
  { id: "DE", label: "Germany" },
  { id: "FR", label: "France" },
  { id: "JP", label: "Japan" },
  { id: "GLOBAL", label: "Global" }
];

export const DEFAULT_USER_ID = "demo-user";

export function countryLabel(country: CountryCode): string {
  return COUNTRIES.find((item) => item.id === country)?.label ?? country;
}
