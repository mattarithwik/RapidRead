import Link from "next/link";
import { isCognitoEnabled } from "@/lib/auth/config";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">RapidRead</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Sign in to your feed</h1>
      <p className="mt-3 text-muted-foreground">
        {isCognitoEnabled()
          ? "Use your account to sync preferences and feedback across devices."
          : "Development mode uses a local session cookie. Click below to start."}
      </p>
      <Link
        href="/api/auth/login"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {isCognitoEnabled() ? "Continue with Cognito" : "Continue as guest"}
      </Link>
    </div>
  );
}
