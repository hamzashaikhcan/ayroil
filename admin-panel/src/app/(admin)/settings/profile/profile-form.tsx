"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card, Field } from "../_shared/fields";

export type AdminMe = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  marketingOptIn: boolean;
  createdAt: string;
};

export function ProfileForm({ initial }: { initial: AdminMe }) {
  const router = useRouter();
  const confirm = useConfirm();

  // Profile fields
  const [email, setEmail] = useState(initial.email);
  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);

    const normalizedEmail = email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== initial.email.toLowerCase();

    // Changing the sign-in email is a destructive action — surface a confirm.
    if (emailChanged) {
      const ok = await confirm({
        title: "Change your sign-in email?",
        description: `You'll need to use ${normalizedEmail} the next time you sign in to the admin console. Make sure you have access to that inbox.`,
        targetName: `${initial.email} → ${normalizedEmail}`,
        confirmLabel: "Change email",
        destructive: true,
      });
      if (!ok) return;
    }

    setSavingProfile(true);
    try {
      await adminClientFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          email: normalizedEmail,
          name: name || null,
          phone: phone || null,
        }),
      });
      setProfileSaved(true);
      router.refresh();
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = await confirm({
      title: "Update your admin password?",
      description:
        "Your current password will stop working immediately. You'll need to use the new password to sign back in.",
      confirmLabel: "Update password",
    });
    if (!ok) return;
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMsg(null);
    try {
      await adminClientFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordMsg(null), 2500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={saveProfile} className="space-y-5">
        <Card title="Account" subtitle="Your admin user record.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
              {email.trim().toLowerCase() !== initial.email.toLowerCase() ? (
                <p className="mt-1 text-xs text-warn">
                  You&apos;ll sign in with this email after saving.
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  Used to sign in to the admin console.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Role</label>
              <input
                value={initial.role}
                disabled
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-background/60 px-3 font-mono text-sm uppercase text-muted"
              />
            </div>
            <Field label="Name" value={name} onChange={setName} placeholder="Admin" />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 (212) 555-0142" />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
            {profileSaved ? <span className="text-xs font-medium text-good">✓ Saved.</span> : null}
            {profileError ? (
              <span className="text-xs text-bad">{profileError}</span>
            ) : null}
          </div>
        </Card>
      </form>

      <form onSubmit={changePassword} className="space-y-5">
        <Card title="Password" subtitle="Use a long, unique password. The change takes effect immediately.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Current password</label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">New password</label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">8+ characters.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={savingPassword || !currentPassword || newPassword.length < 8}>
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
            {passwordMsg ? <span className="text-xs font-medium text-good">✓ {passwordMsg}</span> : null}
            {passwordError ? <span className="text-xs text-bad">{passwordError}</span> : null}
          </div>
        </Card>
      </form>

      <div className="card p-5">
        <div className="text-xs font-medium text-muted">Member since</div>
        <div className="mt-1 text-sm text-ink">
          {new Date(initial.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
