import { cookies } from "next/headers";
import { DEFAULT_USER_ID } from "@/lib/constants";

export const DEMO_USER_COOKIE = "news_demo_user";

export async function getDemoUserId(): Promise<string> {
  return (await cookies()).get(DEMO_USER_COOKIE)?.value ?? DEFAULT_USER_ID;
}

export function createUserId(): string {
  return `user-${crypto.randomUUID()}`;
}
