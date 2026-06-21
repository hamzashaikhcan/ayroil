import { auth } from "@/auth";
import { adminServerFetch } from "@/lib/server-api";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm, type AdminMe } from "./profile-form";

async function fetchMe(): Promise<AdminMe | null> {
  try {
    return await adminServerFetch<AdminMe>("/auth/me");
  } catch {
    return null;
  }
}

export default async function ProfileSettingsPage() {
  const session = await auth();
  const me = await fetchMe();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Your profile"
        subtitle="Update your name, phone, and password for the admin console."
      />
      {me ? (
        <ProfileForm initial={me} />
      ) : (
        <div className="card p-10 text-center">
          <div className="text-sm font-medium text-ink">Couldn&apos;t load your profile</div>
          <p className="mt-2 text-sm text-muted">
            Signed in as <span className="font-mono text-ink">{session?.user.email ?? "—"}</span>, but
            the backend rejected the request. Make sure the express-backend is running.
          </p>
        </div>
      )}
    </div>
  );
}
