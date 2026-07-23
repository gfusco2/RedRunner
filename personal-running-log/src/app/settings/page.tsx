import Link from "next/link";
import { getCurrentProfile, signOut } from "app/actions/auth";
import UnitPreferenceForm from "components/settings/UnitPreferenceForm";
import ProfileForm from "components/settings/ProfileForm";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Units, profile, and account access.
        </p>
      </div>

      <UnitPreferenceForm />

      {profile ? (
        <>
          <ProfileForm
            initialName={profile.name ?? ""}
            email={profile.email}
            role={profile.role}
          />
          <form action={signOut}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink-900">Account</h2>
          <p className="mt-1 mb-4 text-sm text-ink-500">
            Sign in to own your activities and sync preferences across devices.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
