import { redirect } from "next/navigation";
import { PreferenceForm } from "@/components/PreferenceForm";
import { AccountDataPanel } from "@/components/settings/AccountDataPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ensureUserProfile, getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const profile = await ensureUserProfile(session.user.userId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Tune your feed."
        description="Change topic and country preferences without resetting your feedback history."
      />
      <PreferenceForm mode="settings" profile={profile} />
      <AccountDataPanel />
    </div>
  );
}
