import { PreferenceForm } from "@/components/PreferenceForm";
import { defaultProfile } from "@/lib/seed";
import { getProfile } from "@/lib/storage/localStore";
import { getDemoUserId } from "@/lib/user";

export default async function SettingsPage() {
  const userId = await getDemoUserId();
  const profile = (await getProfile(userId)) ?? { ...defaultProfile, userId };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Tune your feed.</h1>
          <p className="lede">
            Change topic and country preferences without resetting your feedback history.
          </p>
        </div>
      </section>
      <PreferenceForm mode="settings" profile={profile} />
    </div>
  );
}
