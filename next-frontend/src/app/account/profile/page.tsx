"use client";

import "react-phone-number-input/style.css";
import "../../checkout/phone-input.css";

import { useEffect, useState } from "react";
import PhoneInput from "react-phone-number-input";
import { relayUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Me = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  marketingOptIn: boolean;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetch(relayUrl("/auth/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMe(data);
        setPhone(data?.phone ?? "");
      });
  }, []);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      phone: phone || null,
      marketingOptIn: fd.get("marketingOptIn") === "on",
    };
    const r = await fetch(relayUrl("/auth/me"), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  async function onChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await confirm({
      title: "Update your password?",
      description:
        "Your existing password will stop working immediately. Make sure you remember the new one before continuing.",
      confirmLabel: "Update password",
    });
    if (!ok) return;
    setPwMsg(null);
    const r = await fetch(relayUrl("/auth/change-password"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(fd.get("currentPassword") || ""),
        newPassword: String(fd.get("newPassword") || ""),
      }),
    });
    if (r.ok) {
      setPwMsg("Password updated.");
      form.reset();
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setPwMsg(body.error ?? "Could not update password.");
    }
  }

  if (!me) return <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="rounded-2xl border border-line bg-surface p-7">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Profile</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Email</label>
            <input value={me.email} disabled className="mt-2 h-11 w-full rounded-md border border-line bg-background/60 px-3.5 text-sm text-muted" />
          </div>
          <div>
            <label htmlFor="name" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Name</label>
            <input id="name" name="name" defaultValue={me.name ?? ""} className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm focus:border-ink focus:outline-none" />
          </div>
          <div>
            <label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Phone</label>
            <PhoneInput
              id="phone"
              international
              defaultCountry="PK"
              countryCallingCodeEditable={false}
              countrySelectProps={{ disabled: true }}
              value={phone}
              onChange={(v) => setPhone(v ?? "")}
              className="mt-2"
            />
          </div>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-xs text-ink">
          <input type="checkbox" name="marketingOptIn" defaultChecked={me.marketingOptIn} /> Send me product updates and offers
        </label>
        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
          {saved ? <span className="text-xs text-muted">Saved.</span> : null}
        </div>
      </form>

      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Password</div>
          <button onClick={() => setPwOpen((v) => !v)} className="text-xs font-medium text-ink underline-offset-4 hover:underline">
            {pwOpen ? "Cancel" : "Change password"}
          </button>
        </div>
        {pwOpen ? (
          <form onSubmit={onChangePassword} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Current password</label>
              <PasswordInput name="currentPassword" required autoComplete="current-password" className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 pr-11 text-sm focus:border-ink focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted">New password</label>
              <PasswordInput name="newPassword" required minLength={8} autoComplete="new-password" className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 pr-11 text-sm focus:border-ink focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary">Update password</Button>
              {pwMsg ? <span className="ml-3 text-xs text-muted">{pwMsg}</span> : null}
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
